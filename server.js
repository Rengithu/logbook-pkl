require('dotenv').config();
const express = require('express');
const path = require('path');

const profileRoutes = require('./src/routes/profile');
const entriesRoutes = require('./src/routes/entries');
const exportRoutes = require('./src/routes/export');
const aiRoutes = require('./src/routes/ai');
const tasksRoutes = require('./src/routes/tasks');
const subjectsRoutes = require('./src/routes/subjects');
const contactsRoutes = require('./src/routes/contacts');
const toolsRoutes = require('./src/routes/tools');
const quickNotesRoutes = require('./src/routes/quickNotes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'client', 'dist')));

app.use('/api/profile', profileRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/quick-notes', quickNotesRoutes);

// 404 JSON untuk path /api/* yang tidak cocok router manapun
// (agar client tidak menerima HTML 404 default Express yang gagal di-parse sebagai JSON)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Basic error handler (e.g. multer file-type / size errors)
app.use((err, req, res, next) => {
  console.error(err);
  // Petakan kode error multer spesifik ke pesan Bahasa Indonesia
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Ukuran file melebihi batas maksimal yang diizinkan' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: 'Jumlah file melebihi batas maksimal' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Jumlah atau jenis file melebihi batas maksimal' });
  }
  // Bukan error multer — pertahankan pesan custom (mis. dari fileFilter, sudah Bahasa Indonesia)
  res.status(400).json({ error: err.message || 'Terjadi kesalahan' });
});

app.listen(PORT, () => {
  console.log(`\nhttp://localhost:${PORT}\n`);
});
