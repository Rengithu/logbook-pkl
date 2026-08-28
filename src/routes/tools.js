const express = require('express');
const router = express.Router();
const multer = require('multer');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');

// Gunakan memoryStorage karena kita tidak perlu menyimpan foto permanen
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // limit 10MB per foto
});

router.post('/img2pdf', upload.array('photos', 50), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Tidak ada foto yang diunggah' });
  }

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

    for (const file of req.files) {
      // Add page first so doc.page is not null (autoFirstPage is false)
      doc.addPage();
      
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
      
      // Render at ~2x resolution for sharp PDF quality
      const renderWidth = Math.round(pageWidth * 2);
      const renderHeight = Math.round(pageHeight * 2);

      // Auto-rotate based on EXIF and resize proportionally to fit within page bounds
      const resizedBuffer = await sharp(file.buffer)
        .rotate() // Fixes portrait photos being forced into landscape
        .resize({ width: renderWidth, height: renderHeight, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();

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
