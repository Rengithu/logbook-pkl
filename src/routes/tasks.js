const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const db = require('../db/sqlite');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    // SECURITY FIX: Sanitize originalname to prevent path traversal
    const safeName = path.basename(file.originalname);
    cb(null, Date.now() + '-' + safeName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_TASK_UPLOAD_SIZE) || 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^(image\/(jpeg|png|webp|gif)|application\/pdf|application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation)|text\/plain|application\/zip)$/;
    if (!allowed.test(file.mimetype)) {
      return cb(new Error('Tipe file tidak diizinkan'));
    }
    cb(null, true);
  }
});

// GET all active tasks
router.get('/', (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks WHERE isDeleted = 0').all();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Gagal memuat tugas.' });
  }
});

// GET trashed tasks
router.get('/trash', (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks WHERE isDeleted = 1').all();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching trashed tasks:', error);
    res.status(500).json({ error: 'Gagal memuat tugas di tempat sampah.' });
  }
});

// POST new task
router.post('/', upload.single('attachment'), (req, res) => {
  try {
    const { title, category, deadline, subject, description, referenceUrl } = req.body;
    
    if (!title || !category) {
      return res.status(400).json({ error: 'Judul dan kategori wajib diisi.' });
    }

    const newTask = {
      id: uuidv4(),
      title,
      category,
      subject: subject || null,
      deadline: deadline || null,
      description: description || '',
      referenceUrl: referenceUrl || '',
      status: 'todo',
      attachmentPath: req.file ? req.file.filename : null,
      attachmentName: req.file ? path.basename(req.file.originalname) : null,
      createdAt: new Date().toISOString()
    };
    
    db.prepare(`
      INSERT INTO tasks (id, title, category, subject, deadline, description, referenceUrl, status, attachmentPath, attachmentName, createdAt, isDeleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      newTask.id, newTask.title, newTask.category, newTask.subject, 
      newTask.deadline, newTask.description, newTask.referenceUrl, 
      newTask.status, newTask.attachmentPath, newTask.attachmentName, 
      newTask.createdAt
    );
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ error: 'Gagal menambahkan tugas.' });
  }
});

// PUT update task
router.put('/:id', upload.single('attachment'), (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    if (!existing) {
      return res.status(404).json({ error: 'Tugas tidak ditemukan.' });
    }
    
    const allowedFields = ['title', 'category', 'subject', 'deadline', 'description', 'referenceUrl', 'status'];
    const newVals = { ...existing };
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        newVals[field] = updates[field];
      }
    }
    
    if (req.file) {
      newVals.attachmentPath = req.file.filename;
      newVals.attachmentName = path.basename(req.file.originalname);
    }
    
    db.prepare(`
      UPDATE tasks SET
        title = ?, category = ?, subject = ?, deadline = ?, description = ?, 
        referenceUrl = ?, status = ?, attachmentPath = ?, attachmentName = ?
      WHERE id = ?
    `).run(
      newVals.title, newVals.category, newVals.subject, newVals.deadline, newVals.description,
      newVals.referenceUrl, newVals.status, newVals.attachmentPath, newVals.attachmentName,
      taskId
    );
    
    res.json(newVals);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Gagal memperbarui tugas.' });
  }
});

// DELETE task (Soft Delete)
router.delete('/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    const result = db.prepare('UPDATE tasks SET isDeleted = 1 WHERE id = ?').run(taskId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tugas tidak ditemukan.' });
    }
    
    res.json({ message: 'Tugas dipindahkan ke tempat sampah.' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Gagal menghapus tugas.' });
  }
});

// RESTORE task
router.post('/:id/restore', (req, res) => {
  try {
    const taskId = req.params.id;
    const result = db.prepare('UPDATE tasks SET isDeleted = 0 WHERE id = ?').run(taskId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tugas tidak ditemukan.' });
    }
    
    res.json({ message: 'Tugas berhasil dipulihkan.' });
  } catch (error) {
    console.error('Error restoring task:', error);
    res.status(500).json({ error: 'Gagal memulihkan tugas.' });
  }
});

// FORCE DELETE task
router.delete('/:id/force', (req, res) => {
  try {
    const taskId = req.params.id;
    const existing = db.prepare('SELECT attachmentPath FROM tasks WHERE id = ?').get(taskId);
    
    if (!existing) {
      return res.status(404).json({ error: 'Tugas tidak ditemukan.' });
    }
    
    if (existing.attachmentPath) {
      const p = path.join(UPLOADS_DIR, existing.attachmentPath);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    
    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
    res.json({ message: 'Tugas permanen dihapus.' });
  } catch (error) {
    console.error('Error force deleting task:', error);
    res.status(500).json({ error: 'Gagal menghapus tugas permanen.' });
  }
});

module.exports = router;
