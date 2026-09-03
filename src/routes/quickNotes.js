const express = require('express');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const db = require('../db/sqlite');

const router = express.Router();

// GET /api/quick-notes?tanggal=YYYY-MM-DD
// Ambil catatan yang belum dipakai (isUsed = 0) untuk tanggal tertentu
router.get('/', (req, res) => {
  const { tanggal } = req.query;
  if (!tanggal) {
    return res.status(400).json({ error: 'Parameter tanggal wajib diisi' });
  }

  const notes = db
    .prepare('SELECT * FROM quick_notes WHERE tanggal = ? AND isUsed = 0 ORDER BY createdAt ASC')
    .all(tanggal);

  res.json(notes);
});

// POST /api/quick-notes
// Tambah catatan baru
router.post('/', (req, res) => {
  const { tanggal, teks } = req.body;
  if (!tanggal || !teks || !teks.trim()) {
    return res.status(400).json({ error: 'Tanggal dan teks catatan wajib diisi' });
  }

  const note = {
    id: uuidv4(),
    tanggal,
    teks: teks.trim(),
    createdAt: dayjs().toISOString(),
    isUsed: 0,
  };

  db.prepare(`
    INSERT INTO quick_notes (id, tanggal, teks, createdAt, isUsed)
    VALUES (?, ?, ?, ?, 0)
  `).run(note.id, note.tanggal, note.teks, note.createdAt);

  res.status(201).json(note);
});

// DELETE /api/quick-notes/:id
// Hapus satu catatan secara permanen
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM quick_notes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Catatan tidak ditemukan' });
  }
  res.json({ success: true });
});

// PUT /api/quick-notes/mark-used
// Tandai catatan sebagai sudah dipakai (isUsed = 1) setelah entry disimpan
router.put('/mark-used', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids harus berupa array yang tidak kosong' });
  }

  const placeholders = ids.map(() => '?').join(', ');
  const result = db
    .prepare(`UPDATE quick_notes SET isUsed = 1 WHERE id IN (${placeholders})`)
    .run(...ids);

  res.json({ updated: result.changes });
});

module.exports = router;
