const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/sqlite');

// GET all active subjects
router.get('/', (req, res) => {
  try {
    // We treat subjects as active if they exist in the subjects table. 
    // The previous implementation used isDeleted but it wasn't consistently used. Let's assume no soft deletes for subjects to match schema, 
    // or add it if needed. The sqlite schema I created didn't have isDeleted for subjects, so I'll just return all.
    const subjects = db.prepare('SELECT * FROM subjects').all();
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Gagal memuat mapel.' });
  }
});

// POST new subject
router.post('/', (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nama mapel wajib diisi.' });
    }

    const trimmedName = name.trim();
    
    // Check for duplicates
    const existing = db.prepare('SELECT * FROM subjects WHERE LOWER(name) = LOWER(?)').get(trimmedName);
    if (existing) {
      return res.status(400).json({ error: 'Mapel ini sudah ada.' });
    }

    const newSubject = {
      id: uuidv4(),
      name: trimmedName
    };
    
    db.prepare('INSERT INTO subjects (id, name) VALUES (?, ?)').run(newSubject.id, newSubject.name);
    
    res.status(201).json(newSubject);
  } catch (error) {
    console.error('Error adding subject:', error);
    res.status(500).json({ error: 'Gagal menambahkan mapel.' });
  }
});

// PUT update subject (rename)
router.put('/:id', (req, res) => {
  try {
    const subjectId = req.params.id;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Nama mapel wajib diisi.' });
    }

    const trimmedName = name.trim();

    const existing = db.prepare('SELECT id FROM subjects WHERE id = ?').get(subjectId);
    if (!existing) {
      return res.status(404).json({ error: 'Mapel tidak ditemukan.' });
    }

    // Cek duplikat (case-insensitive), kecuali untuk mapel yang sedang diedit sendiri
    const duplicate = db.prepare('SELECT id FROM subjects WHERE LOWER(name) = LOWER(?) AND id != ?').get(trimmedName, subjectId);
    if (duplicate) {
      return res.status(400).json({ error: 'Mapel dengan nama ini sudah ada.' });
    }

    db.prepare('UPDATE subjects SET name = ? WHERE id = ?').run(trimmedName, subjectId);

    res.json({ id: subjectId, name: trimmedName });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ error: 'Gagal memperbarui mapel.' });
  }
});

// DELETE subject (Hard Delete instead of soft delete since no isDeleted column)
router.delete('/:id', (req, res) => {
  try {
    const subjectId = req.params.id;

    // Hitung dulu berapa task yang masih mereferensikan mapel ini (task menyimpan nama mapel, bukan id)
    const affected = db.prepare(`
      SELECT COUNT(*) AS count FROM tasks
      WHERE subject = (SELECT name FROM subjects WHERE id = ?)
    `).get(subjectId);
    const affectedTasksCount = affected ? affected.count : 0;

    const result = db.prepare('DELETE FROM subjects WHERE id = ?').run(subjectId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Mapel tidak ditemukan.' });
    }
    
    res.json({ message: 'Mapel dihapus.', affectedTasksCount });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ error: 'Gagal menghapus mapel.' });
  }
});

// FORCE DELETE subject (Hard Delete)
router.delete('/:id/force', (req, res) => {
  try {
    const subjectId = req.params.id;
    const result = db.prepare('DELETE FROM subjects WHERE id = ?').run(subjectId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Mapel tidak ditemukan.' });
    }
    
    res.json({ message: 'Mapel permanen dihapus.' });
  } catch (error) {
    console.error('Error force deleting subject:', error);
    res.status(500).json({ error: 'Gagal menghapus mapel permanen.' });
  }
});

module.exports = router;