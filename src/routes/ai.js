const express = require('express');
const router = express.Router();
const db = require('../db/sqlite');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const baseUrl = process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_URL = `${baseUrl}/${GEMINI_MODEL}:generateContent`;

function getApiKey() {
  const profile = db.prepare('SELECT geminiApiKey FROM profile WHERE id = 1').get();
  return (profile && profile.geminiApiKey) || process.env.GEMINI_API_KEY;
}

function buildRephrasePrompt(text) {
  return `Kamu membantu siswa PKL (Praktik Kerja Lapangan) menulis ulang catatan kegiatan hariannya di jurnal PKL.
Job desk di tempat PKL ini bergantian setiap 2 hari, sehingga beberapa siswa kadang mengerjakan pekerjaan yang sama dan
menuliskan deskripsi yang mirip di jurnal masing-masing. Tugasmu: tulis ulang teks berikut dengan gaya bahasa, susunan
kalimat, dan pilihan kata yang berbeda, TANPA mengubah fakta, maksud, atau menambah informasi baru yang tidak ada di
teks asli. Gunakan Bahasa Indonesia yang natural dan sesuai nada laporan PKL formal. Balas HANYA dengan hasil tulisan
ulang saja, tanpa tanda kutip, tanpa penjelasan tambahan, tanpa awalan seperti "Berikut hasilnya:".

Teks asli:
"""
${text}
"""`;
}

async function callGemini(promptText) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw { status: 500, message: 'API Key Gemini belum diisi. Isi lewat menu Profil (⚙️) atau file .env' };
  }

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error('Gemini API error:', response.status, errBody);
    throw { status: 502, message: `Gagal menghubungi Gemini API (status ${response.status})` };
  }

  const data = await response.json();
  const resultText = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();

  if (!resultText) {
    throw { status: 502, message: 'Gemini tidak mengembalikan teks. Coba lagi.' };
  }

  return resultText;
}

// ─── Rephrase endpoint (used by the "AI Rephrase" button in entry form) ───
router.post('/rephrase', async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Teks kegiatan masih kosong, isi dulu sebelum minta bantuan AI' });
  }

  try {
    const resultText = await callGemini(buildRephrasePrompt(text));
    res.json({ text: resultText });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Gagal memproses permintaan ke Gemini API' });
  }
});

// ─── General chat/generate endpoint (used by AI Chat Panel "Tanya LogBook") ───
router.post('/generate', async (req, res) => {
  const { prompt, mentionedTaskIds } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt tidak boleh kosong' });
  }

  // Whitelist ID task yang BOLEH diupdate — hanya yang eksplisit di-@mention user dari frontend.
  // Ini mencegah Gemini "menebak" task mana yang dimaksud dari nama bebas yang ditulis user.
  const allowedTaskIds = Array.isArray(mentionedTaskIds) ? mentionedTaskIds : [];

  const apiKey = getApiKey();
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key Gemini belum diisi.' });
  }

  const systemPrompt = `Kamu adalah asisten AI yang membantu siswa dalam kegiatan Praktek Kerja Lapangan (PKL). 
Jawab dengan ringkas, informatif, dan dalam Bahasa Indonesia yang baik. 
Gunakan tool yang tersedia jika diminta untuk mencatat tugas (create_task), mencatat kegiatan cepat (create_quick_note), melihat tugas (get_tasks), atau melihat catatan jurnal (get_recent_entries).
PENTING: Jangan gunakan tool jika user hanya bertanya santai atau tidak ada indikasi yang jelas untuk membuat data. Untuk create_task, jangan asal menebak deadline jika tidak disebutkan. Untuk create_quick_note, teks wajib ada.
PENTING SOAL update_task_status: HANYA gunakan tool ini jika user secara eksplisit mereferensikan task lewat mention (ditandai dalam prompt sebagai "[TASK DIREFERENSIKAN: <id> - <judul>]"). Jika user menyebut nama task secara bebas TANPA referensi mention itu, JANGAN gunakan tool ini — jawab dengan teks biasa yang meminta user mengetik "@" lalu memilih task yang dimaksud dari daftar, supaya tidak salah update task yang lain.`;

  const tools = [
    {
      function_declarations: [
        {
          name: 'create_task',
          description: 'Membuat tugas/task baru. Gunakan ini jika user meminta untuk mengingatkan atau mencatat tugas/deadline.',
          parameters: {
            type: 'OBJECT',
            properties: {
              title: {
                type: 'STRING',
                description: 'Judul atau deskripsi singkat tugas. Wajib diisi.'
              },
              deadline: {
                type: 'STRING',
                description: 'Tenggat waktu (deadline) tugas dalam format YYYY-MM-DD. Biarkan kosong jika tidak disebutkan spesifik.'
              }
            },
            required: ['title']
          }
        },
        {
          name: 'create_quick_note',
          description: 'Membuat catatan cepat (quick note) kegiatan hari ini. Gunakan ini jika user ingin mencatat apa yang baru saja mereka lakukan untuk bahan jurnal nanti.',
          parameters: {
            type: 'OBJECT',
            properties: {
              teks: {
                type: 'STRING',
                description: 'Deskripsi kegiatan yang dicatat. Wajib diisi.'
              }
            },
            required: ['teks']
          }
        },
        {
          name: 'get_tasks',
          description: 'Mengambil daftar tugas/task yang saat ini ada. Gunakan ini jika user menanyakan tugas apa yang belum selesai atau menanyakan deadline terdekat.',
          parameters: {
            type: 'OBJECT',
            properties: {}
          }
        },
        {
          name: 'get_recent_entries',
          description: 'Mengambil beberapa catatan jurnal harian terbaru. Gunakan ini jika user menanyakan apa saja yang sudah dikerjakan belakangan ini.',
          parameters: {
            type: 'OBJECT',
            properties: {}
          }
        },
        {
          name: 'update_task_status',
          description: 'Mengubah status sebuah task (misal menjadi selesai). HANYA boleh dipanggil jika taskId berasal dari task yang eksplisit di-mention user (lihat instruksi sistem).',
          parameters: {
            type: 'OBJECT',
            properties: {
              taskId: {
                type: 'STRING',
                description: 'ID task yang direferensikan lewat mention. Wajib persis sama dengan ID yang diberikan dalam referensi mention.'
              },
              status: {
                type: 'STRING',
                description: 'Status baru, salah satu dari: todo, in_progress, done'
              }
            },
            required: ['taskId', 'status']
          }
        }
      ]
    }
  ];

  let mentionContext = '';
  if (allowedTaskIds.length > 0) {
    const mentionedTasks = db.prepare(
      `SELECT id, title FROM tasks WHERE id IN (${allowedTaskIds.map(() => '?').join(',')})`
    ).all(...allowedTaskIds);
    mentionContext = mentionedTasks.map(t => `[TASK DIREFERENSIKAN: ${t.id} - ${t.title}]`).join('\n');
  }

  let messages = [
    { role: 'user', parts: [{ text: `${systemPrompt}\n\n${mentionContext}\n\nPertanyaan pengguna:\n${prompt}` }] }
  ];

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  async function fetchGemini(body) {
    const maxRetries = 3;
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) await delay(1000 * Math.pow(2, attempt - 1)); // 1s, 2s
      const r = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body)
      });
      if (r.status === 503 || r.status === 429) {
        const txt = await r.text();
        lastError = new Error(`Gemini API error (status ${r.status}): ${txt}`);
        console.warn(`[AI] Attempt ${attempt + 1} failed (${r.status}), retrying...`);
        continue;
      }
      if (!r.ok) throw new Error(`Gemini API error (status ${r.status}): ${await r.text()}`);
      return r.json();
    }
    throw lastError;
  }

  try {
    // 1st API Call
    console.time('[AI] Gemini call #1');
    let data = await fetchGemini({ contents: messages, tools: tools });
    console.timeEnd('[AI] Gemini call #1');
    let responsePart = data?.candidates?.[0]?.content?.parts?.[0];
    
    let actionTaken = null;

    if (responsePart?.functionCall) {
      const { name, args } = responsePart.functionCall;
      messages.push({ role: 'model', parts: [responsePart] });
      
      let functionResponseData = {};
      
      try {
        if (name === 'create_task') {
          const id = uuidv4();
          const createdAt = new Date().toISOString();
          db.prepare('INSERT INTO tasks (id, title, category, deadline, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
            .run(id, args.title, 'other', args.deadline || null, 'todo', createdAt);
          const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
          functionResponseData = { success: true, message: `Task '${args.title}' berhasil ditambahkan.`, task: newTask };
          actionTaken = { type: 'create_task', data: newTask };
        } 
        else if (name === 'create_quick_note') {
          const id = uuidv4();
          const tanggal = dayjs().format('YYYY-MM-DD');
          const createdAt = new Date().toISOString();
          db.prepare('INSERT INTO quick_notes (id, tanggal, teks, createdAt) VALUES (?, ?, ?, ?)')
            .run(id, tanggal, args.teks, createdAt);
          const newNote = db.prepare('SELECT * FROM quick_notes WHERE id = ?').get(id);
          functionResponseData = { success: true, message: `Catatan cepat '${args.teks}' berhasil disimpan.`, note: newNote };
          actionTaken = { type: 'create_quick_note', data: newNote };
        }
        else if (name === 'get_tasks') {
          const tasks = db.prepare('SELECT id, title, deadline, status FROM tasks WHERE isDeleted = 0 ORDER BY deadline ASC NULLS LAST').all();
          functionResponseData = { success: true, tasks: tasks };
        }
        else if (name === 'get_recent_entries') {
          const entries = db.prepare('SELECT id, tanggal, hari, kegiatan FROM entries WHERE isDeleted = 0 ORDER BY tanggal DESC LIMIT 5').all();
          functionResponseData = { success: true, entries: entries };
        }
        else if (name === 'update_task_status') {
          // VALIDASI KEAMANAN: tolak kalau taskId bukan dari daftar yang eksplisit di-mention user.
          // Ini mencegah Gemini "menebak" ID task dari nama bebas — hanya ID yang benar-benar
          // dipilih user lewat @mention di frontend yang diizinkan sampai sini.
          if (!allowedTaskIds.includes(args.taskId)) {
            functionResponseData = {
              success: false,
              error: 'Task ini tidak direferensikan lewat mention yang valid. Minta user mengetik "@" dan memilih task dari daftar terlebih dahulu.'
            };
          } else {
            const validStatuses = ['todo', 'in_progress', 'done'];
            if (!validStatuses.includes(args.status)) {
              functionResponseData = { success: false, error: 'Status tidak valid.' };
            } else {
              const existing = db.prepare('SELECT * FROM tasks WHERE id = ? AND isDeleted = 0').get(args.taskId);
              if (!existing) {
                functionResponseData = { success: false, error: 'Task tidak ditemukan.' };
              } else {
                db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(args.status, args.taskId);
                const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(args.taskId);
                functionResponseData = { success: true, message: `Status task '${updated.title}' diubah menjadi ${args.status}.`, task: updated };
                actionTaken = { type: 'update_task_status', data: updated };
              }
            }
          }
        }
        else {
          functionResponseData = { success: false, error: 'Function not implemented.' };
        }
      } catch (err) {
        console.error('Error executing function:', err);
        functionResponseData = { success: false, error: err.message };
      }

      messages.push({
        role: 'user',
        parts: [{ functionResponse: { name, response: functionResponseData } }]
      });

      // 2nd API Call
      console.time('[AI] Gemini call #2 (after function)');
      data = await fetchGemini({ contents: messages, tools: tools });
      console.timeEnd('[AI] Gemini call #2 (after function)');
      responsePart = data?.candidates?.[0]?.content?.parts?.[0];
    }

    const resultText = responsePart?.text || 'Maaf, saya tidak bisa memberikan respons yang valid.';
    res.json({ result: resultText, actionTaken });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Gagal memproses permintaan ke Gemini API' });
  }
});

// ─── Generate from quick notes (used by "Generate dari Catatan Cepat" button) ───
router.post('/generate-from-notes', async (req, res) => {
  const { notes } = req.body;
  if (!Array.isArray(notes) || notes.length === 0) {
    return res.status(400).json({ error: 'notes harus berupa array yang tidak kosong' });
  }

  const systemPrompt = `Gabungkan poin-poin catatan berikut menjadi SATU PARAGRAF singkat yang menceritakan kegiatan hari itu.
JANGAN gunakan bullet point atau penomoran.
JANGAN menyebutkan waktu/jam spesifik, cukup fokus pada kegiatan yang dilakukan.
JANGAN menggunakan kalimat pembuka seperti "Hari ini", "Pada hari ini", atau semacamnya — langsung mulai dengan kata kerja yang menjelaskan kegiatan.
Gunakan bahasa yang natural dan tidak bertele-tele, seperti gaya bahasa sehari-hari yang sopan.`;

  const notesList = notes.map((n, i) => `${i + 1}. ${n}`).join('\n');
  const fullPrompt = `${systemPrompt}\n\nCatatan:\n${notesList}`;

  try {
    const resultText = await callGemini(fullPrompt);
    res.json({ text: resultText });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Gagal memproses permintaan ke Gemini API' });
  }
});

module.exports = router;