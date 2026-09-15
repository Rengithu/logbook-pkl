const express = require('express');
const router = express.Router();
const multer = require('multer');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');

// Gunakan memoryStorage karena kita tidak perlu menyimpan foto permanen
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // limit 10MB per foto
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      return cb(new Error('Hanya file gambar (jpg, png, webp) yang diizinkan'));
    }
    cb(null, true);
  }
});

router.post('/img2pdf', upload.array('photos', 50), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Tidak ada foto yang diunggah' });
  }

  // Ukuran A4 (pt) & margin sama dengan PDFDocument di bawah — dipakai untuk render ~2x
  const A4_WIDTH = 595.28, A4_HEIGHT = 841.89, MARGIN = 40;
  const renderWidth = Math.round((A4_WIDTH - MARGIN * 2) * 2);
  const renderHeight = Math.round((A4_HEIGHT - MARGIN * 2) * 2);

  // Fase 1: proses tiap file secara individual — yang gagal dicatat, yang lain lanjut
  const processed = [];
  const failedFiles = [];
  for (const file of req.files) {
    try {
      const resizedBuffer = await sharp(file.buffer)
        .rotate() // Auto-rotate berdasarkan EXIF (mencegah foto portrait jadi landscape)
        .resize({ width: renderWidth, height: renderHeight, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
      processed.push(resizedBuffer);
    } catch (err) {
      console.error(`Gagal memproses file ${file.originalname}:`, err.message);
      failedFiles.push(file.originalname);
    }
  }

  // Ada file gagal -> kirim JSON error yang menyebut nama file SEBELUM mulai streaming PDF
  if (failedFiles.length > 0) {
    return res.status(500).json({
      error: `${failedFiles.length} dari ${req.files.length} file gagal diproses: ${failedFiles.join(', ')}`,
      failedFiles
    });
  }

  // Fase 2: semua file sukses — susun PDF seperti biasa
  try {
    const doc = new PDFDocument({ 
      size: 'A4', 
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      autoFirstPage: false
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Image-to-PDF.pdf"');
    
    // Pipe PDF langsung ke response
    doc.pipe(res);

    for (const resizedBuffer of processed) {
      // Add page first so doc.page is not null (autoFirstPage is false)
      doc.addPage();
      
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

      // Place image centered while maintaining aspect ratio
      doc.image(resizedBuffer, doc.page.margins.left, doc.page.margins.top, {
        fit: [pageWidth, pageHeight],
        align: 'center',
        valign: 'center'
      });
    }

    doc.end();
  } catch (err) {
    console.error('Error generating PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Terjadi kesalahan saat membuat PDF' });
    }
  }
});

module.exports = router;
