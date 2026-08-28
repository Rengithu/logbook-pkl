const PDFDocument = require('pdfkit');
const { hariTanggalIndo, weekRangeLabel } = require('../utils/dateHelper');

const PRIMARY = '#1F4E79';
const MUTED = '#555555';
const BORDER = '#000000';
const TEXT = '#111111';

const INFO_LABEL_X_OFFSET = 160; // fixed offset so every colon lines up

function infoLine(doc, label, value) {
  const x = doc.page.margins.left;
  const y = doc.y;
  doc.fontSize(12).font('Times-Bold').fillColor(TEXT).text(label, x, y);
  doc.font('Times-Roman').text(`: ${value || '-'}`, x + INFO_LABEL_X_OFFSET, y);
  doc.x = x;
}

async function generateWeekPdf(profile, weekKey, entries) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 45, bottom: 45, left: 45, right: 45 } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Times-Bold').fontSize(14).fillColor(TEXT)
      .text('JURNAL KEGIATAN PKL', { align: 'center' });
    doc.moveDown(0.2);
    doc.font('Times-Roman').fontSize(11).fillColor(MUTED)
      .text(`Periode: ${weekRangeLabel(weekKey, entries)}`, { align: 'center' });
    doc.moveDown(0.4);
    doc.moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor(TEXT).lineWidth(1.2).stroke();
    doc.moveDown(0.8);
    doc.fillColor(TEXT);

    infoLine(doc, 'Nama Peserta Didik', profile.namaPeserta);
    infoLine(doc, 'Dunia Kerja Tempat PKL', profile.tempatPkl);
    infoLine(doc, 'Nama Instruktur', profile.namaInstruktur);
    infoLine(doc, 'Nama Pembimbing PKL', profile.namaPembimbing);
    doc.moveDown(0.8);

    const sortedEntries = [...entries].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    const left = doc.page.margins.left;
    const totalWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidths = [32, 130, 230, totalWidth - 32 - 130 - 230];
    const headers = ['No', 'Hari / Tanggal', 'Unit Kerja / Pekerjaan', 'Catatan'];
    const rowPadding = 6;

    function displayValue(text, isHeader) {
      if (text === '') return ''; // intentionally blank (e.g. left for handwritten notes)
      return text || (isHeader ? '' : '-');
    }

    function drawRow(cells, isHeader, minRowHeight = 0) {
      const startY = doc.y;
      doc.fontSize(11).font(isHeader ? 'Times-Bold' : 'Times-Roman');
      const heights = cells.map((text, i) => doc.heightOfString(displayValue(text, isHeader), { width: colWidths[i] - rowPadding * 2 }));
      const rowHeight = Math.max(...heights, minRowHeight) + rowPadding * 2;

      if (startY + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        return drawRow(cells, isHeader, minRowHeight);
      }

      let x = left;
      // We no longer fill the header background with a color
      doc.fillColor(TEXT);
      cells.forEach((text, i) => {
        doc.rect(x, startY, colWidths[i], rowHeight).stroke(BORDER);
        doc.fontSize(11).font(isHeader ? 'Times-Bold' : 'Times-Roman')
          .fillColor(TEXT)
          .text(displayValue(text, isHeader), x + rowPadding, startY + rowPadding, {
            width: colWidths[i] - rowPadding * 2,
            align: (i === 0 && !isHeader) ? 'center' : 'left'
          });
        x += colWidths[i];
      });
      doc.fillColor(TEXT);
      doc.y = startY + rowHeight;
      doc.x = left;
    }

    drawRow(headers, true);
    sortedEntries.forEach((entry, idx) => {
      drawRow([
        String(idx + 1),
        hariTanggalIndo(entry.tanggal),
        entry.kegiatan,
        ''
      ], false, 28);
    });

    doc.moveDown(1);
    doc.fontSize(10).font('Times-Italic').fillColor(MUTED)
      .text('*) Catatan diberikan oleh Instruktur dunia kerja pada setiap kegiatan atau waktu tertentu');

    doc.end();
  });
}

module.exports = { generateWeekPdf };

