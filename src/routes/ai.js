const express = require('express');
const router = express.Router();
const db = require('../db/sqlite');

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
  const { prompt } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt tidak boleh kosong' });
  }

  const systemPrompt = `Kamu adalah asisten AI yang membantu siswa dalam kegiatan Praktek Kerja Lapangan (PKL). 
Jawab dengan ringkas, informatif, dan dalam Bahasa Indonesia yang baik. 
Jika ditanya hal di luar konteks PKL, tetap jawab dengan sopan.`;

  const fullPrompt = `${systemPrompt}\n\nPertanyaan pengguna:\n${prompt}`;

  try {
    const resultText = await callGemini(fullPrompt);
    res.json({ result: resultText });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Gagal memproses permintaan ke Gemini API' });
  }
});

module.exports = router;
