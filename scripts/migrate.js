const fs = require('fs');
const path = require('path');
const db = require('../src/db/sqlite');

const DATA_DIR = path.join(__dirname, '../data');

console.log('Memulai migrasi dari JSON ke SQLite...');

// 1. Migrate db.json (profile & entries)
const dbJsonPath = path.join(DATA_DIR, 'db.json');
if (fs.existsSync(dbJsonPath)) {
  const data = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
  
  if (data.profile) {
    db.prepare(`
      UPDATE profile SET 
        namaPeserta = ?, 
        tempatPkl = ?, 
        namaInstruktur = ?, 
        namaPembimbing = ?, 
        geminiApiKey = ?
      WHERE id = 1
    `).run(
      data.profile.namaPeserta || '',
      data.profile.tempatPkl || '',
      data.profile.namaInstruktur || '',
      data.profile.namaPembimbing || '',
      data.profile.geminiApiKey || ''
    );
    console.log('✅ Profile berhasil dimigrasi.');
  }

  if (Array.isArray(data.entries)) {
    const insertEntry = db.prepare(`
      INSERT OR REPLACE INTO entries (id, tanggal, hari, kegiatan, photos, createdAt, isDeleted)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    let count = 0;
    for (const entry of data.entries) {
      insertEntry.run(
        entry.id,
        entry.tanggal,
        entry.hari,
        entry.kegiatan,
        JSON.stringify(entry.photos || []),
        entry.createdAt,
        entry.isDeleted ? 1 : 0
      );
      count++;
    }
    console.log(`✅ ${count} Entri berhasil dimigrasi.`);
  }
}

// 2. Migrate tasks.json
const tasksJsonPath = path.join(DATA_DIR, 'tasks.json');
if (fs.existsSync(tasksJsonPath)) {
  const tasks = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf8'));
  if (Array.isArray(tasks)) {
    const insertTask = db.prepare(`
      INSERT OR REPLACE INTO tasks (id, title, category, subject, deadline, description, referenceUrl, status, attachmentPath, attachmentName, createdAt, isDeleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let count = 0;
    for (const task of tasks) {
      insertTask.run(
        task.id,
        task.title,
        task.category || 'Sekolah',
        task.subject || null,
        task.deadline || null,
        task.description || '',
        task.referenceUrl || '',
        task.status || 'todo',
        task.attachmentPath || null,
        task.attachmentName || null,
        task.createdAt,
        task.isDeleted ? 1 : 0
      );
      count++;
    }
    console.log(`✅ ${count} Tugas berhasil dimigrasi.`);
  }
}

// 3. Migrate subjects.json
const subjectsJsonPath = path.join(DATA_DIR, 'subjects.json');
if (fs.existsSync(subjectsJsonPath)) {
  const subjects = JSON.parse(fs.readFileSync(subjectsJsonPath, 'utf8'));
  if (Array.isArray(subjects)) {
    const insertSubj = db.prepare(`INSERT OR REPLACE INTO subjects (id, name) VALUES (?, ?)`);
    let count = 0;
    for (const s of subjects) {
      insertSubj.run(s.id, s.name);
      count++;
    }
    console.log(`✅ ${count} Mapel berhasil dimigrasi.`);
  }
}

console.log('🎉 Migrasi selesai! Data Anda sudah ada di data/database.sqlite');
