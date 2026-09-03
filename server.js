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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// Basic error handler (e.g. multer file-type / size errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || 'Terjadi kesalahan' });
});

app.listen(PORT, () => {
  console.log(`\nhttp://localhost:${PORT}\n`);
});
