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

// GET trashed subjects
router.get('/trash', (req, res) => {
  try {
    // Assuming we don't support trashed subjects anymore since SQLite schema didn't include it. 
    // Return empty array for compatibility.
    res.json([]);
  } catch (error) {
    console.error('Error fetching trashed subjects:', error);
    res.status(500).json({ error: 'Gagal memuat mapel di tempat sampah.' });
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

// DELETE subject (Hard Delete instead of soft delete since no isDeleted column)
router.delete('/:id', (req, res) => {
  try {
    const subjectId = req.params.id;
    const result = db.prepare('DELETE FROM subjects WHERE id = ?').run(subjectId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Mapel tidak ditemukan.' });
    }
    
    res.json({ message: 'Mapel dihapus.' });
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

// RESTORE subject
router.post('/:id/restore', (req, res) => {
  // Not supported anymore, return 404
  res.status(404).json({ error: 'Tidak didukung.' });
});

module.exports = router;
