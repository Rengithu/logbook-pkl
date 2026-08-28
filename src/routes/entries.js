const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const sharp = require('sharp');
const db = require('../db/sqlite');
const { namaHari, weekKey } = require('../utils/dateHelper');

const router = express.Router();

async function processPhotos(files) {
  if (!files || files.length === 0) return [];
  
  const processed = await Promise.all(files.map(async (f) => {
    const p = path.join(__dirname, '..', '..', 'uploads', f.filename);
    const newFilename = `${uuidv4()}.webp`;
    const tmpPath = path.join(__dirname, '..', '..', 'uploads', newFilename);
    try {
      await sharp(p)
        .rotate() // Auto-orient based on EXIF to prevent portrait photos appearing sideways/landscape
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(tmpPath);
      if (fs.existsSync(p)) fs.promises.unlink(p).catch(console.error);
      return newFilename;
    } catch (err) {
      console.error('Sharp error:', err);
      return f.filename;
    }
  }));
  
  return processed;
}

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      return cb(new Error('Hanya file gambar (jpg, png, webp) yang diizinkan'));
    }
    cb(null, true);
  }
});

// List all entries (optionally filter by ?week=YYYY-MM-DD)
router.get('/', (req, res) => {
  let entries = db.prepare('SELECT * FROM entries WHERE isDeleted = 0 ORDER BY tanggal DESC').all();
  // Parse photos JSON strings
  entries = entries.map(e => ({ ...e, photos: JSON.parse(e.photos || '[]') }));
  
  if (req.query.week) {
    entries = entries.filter((e) => weekKey(e.tanggal) === req.query.week);
  }
  res.json(entries);
});

// Group entries by week -> summary list of weeks
router.get('/weeks', (req, res) => {
  let entries = db.prepare('SELECT tanggal FROM entries WHERE isDeleted = 0').all();
  const map = {};
  entries.forEach((e) => {
    const wk = weekKey(e.tanggal);
    if (!map[wk]) map[wk] = 0;
    map[wk]++;
  });
  const weeks = Object.keys(map).sort().reverse().map((wk) => ({
    weekKey: wk,
    count: map[wk]
  }));
  res.json(weeks);
});

// Get all deleted entries (trash)
router.get('/trash', (req, res) => {
  let entries = db.prepare('SELECT * FROM entries WHERE isDeleted = 1 ORDER BY tanggal DESC').all();
  entries = entries.map(e => ({ ...e, photos: JSON.parse(e.photos || '[]') }));
  res.json(entries);
});

router.get('/:id', (req, res) => {
  const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entri tidak ditemukan' });
  entry.photos = JSON.parse(entry.photos || '[]');
  res.json(entry);
});

router.post('/', upload.array('photos', 10), async (req, res) => {
  const { tanggal, kegiatan } = req.body;
  if (!tanggal || !kegiatan) {
    return res.status(400).json({ error: 'Tanggal dan kegiatan wajib diisi' });
  }
  const photos = await processPhotos(req.files || []);
  const entry = {
    id: uuidv4(),
    tanggal,
    hari: namaHari(tanggal),
    kegiatan,
    photos,
    createdAt: dayjs().toISOString()
  };
  
  db.prepare(`
    INSERT INTO entries (id, tanggal, hari, kegiatan, photos, createdAt, isDeleted)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(entry.id, entry.tanggal, entry.hari, entry.kegiatan, JSON.stringify(entry.photos), entry.createdAt);
  
  res.status(201).json(entry);
});

router.put('/:id', upload.array('photos', 10), async (req, res) => {
  const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entri tidak ditemukan' });
  
  entry.photos = JSON.parse(entry.photos || '[]');

  const { tanggal, kegiatan, removePhotos } = req.body;
  let photos = entry.photos || [];

  if (removePhotos) {
    let toRemove;
    try {
      toRemove = JSON.parse(removePhotos);
    } catch {
      return res.status(400).json({ error: 'Format removePhotos tidak valid' });
    }
    if (!Array.isArray(toRemove)) {
      return res.status(400).json({ error: 'removePhotos harus berupa array' });
    }
    toRemove = toRemove.filter((f) => typeof f === 'string' && f === path.basename(f) && !f.includes('..'));
    photos = photos.filter((p) => !toRemove.includes(p));
    toRemove.forEach((filename) => {
      const p = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  }
  
  const newPhotos = await processPhotos(req.files || []);
  photos = [...photos, ...newPhotos];

  const updated = {
    ...entry,
    tanggal: tanggal || entry.tanggal,
    hari: namaHari(tanggal || entry.tanggal),
    kegiatan: kegiatan ?? entry.kegiatan,
    photos
  };
  
  db.prepare(`
    UPDATE entries SET tanggal = ?, hari = ?, kegiatan = ?, photos = ?
    WHERE id = ?
  `).run(updated.tanggal, updated.hari, updated.kegiatan, JSON.stringify(updated.photos), updated.id);
  
  res.json(updated);
});

router.put('/:id/restore', (req, res) => {
  const result = db.prepare('UPDATE entries SET isDeleted = 0 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Entri tidak ditemukan' });
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Entri tidak ditemukan' });
  
  if (req.query.force === 'true') {
    const photos = JSON.parse(entry.photos || '[]');
    photos.forEach((filename) => {
      const p = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
    db.prepare('DELETE FROM entries WHERE id = ?').run(req.params.id);
  } else {
    db.prepare('UPDATE entries SET isDeleted = 1 WHERE id = ?').run(req.params.id);
  }
  res.json({ success: true });
});

module.exports = router;
