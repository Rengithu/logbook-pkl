const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, VerticalAlign, TabStopType
} = require('docx');
const { hariTanggalIndo, weekRangeLabel } = require('../utils/dateHelper');
const theme = require('./theme');

const PAGE_WIDTH_DXA = 11906;
const MARGIN_DXA = 1000;
const CONTENT_WIDTH_DXA = PAGE_WIDTH_DXA - MARGIN_DXA * 2;
const FONT_NAME = theme.fonts.base || 'Times New Roman';

const COL_WIDTHS = [700, 2400, 4306, 2500]; // No | Hari/Tanggal | Unit Kerja/Pekerjaan | Catatan

function cellBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 4, color: theme.colors.border },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: theme.colors.border },
    left: { style: BorderStyle.SINGLE, size: 4, color: theme.colors.border },
    right: { style: BorderStyle.SINGLE, size: 4, color: theme.colors.border }
  };
}

function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: theme.colors.primary },
    borders: cellBorder(),
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 120, bottom: 120, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text, bold: true, color: 'FFFFFF', size: 22, font: FONT_NAME })
        ]
      })
    ]
  });
}

function bodyCell(text, width, alignCenter = false, allowEmpty = false) {
  const displayText = text || (allowEmpty ? '' : '-');
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: cellBorder(),
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 120, bottom: 200, left: 120, right: 120 },
    children: [
      new Paragraph({
        alignment: alignCenter ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [
          new TextRun({ text: displayText, size: 22, font: FONT_NAME, color: theme.colors.text })
        ]
      })
    ]
  });
}

const INFO_LABEL_TAB_DXA = 2800; // tab stop position so every colon lines up

function infoLine(label, value) {
  return new Paragraph({
    spacing: { after: 50 },
    tabStops: [{ type: TabStopType.LEFT, position: INFO_LABEL_TAB_DXA }],
    children: [
      new TextRun({ text: `${label}`, bold: true, size: 24, font: FONT_NAME, color: theme.colors.text }),
      new TextRun({ text: `\t: ${value || '-'}`, size: 24, font: FONT_NAME, color: theme.colors.text })
    ]
  });
}

async function generateWeekDocx(profile, weekKey, entries) {
  const sortedEntries = [...entries].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell('No', COL_WIDTHS[0]),
      headerCell('Hari / Tanggal', COL_WIDTHS[1]),
      headerCell('Unit Kerja / Pekerjaan', COL_WIDTHS[2]),
      headerCell('Catatan', COL_WIDTHS[3])
    ]
  });

  const bodyRows = sortedEntries.map((entry, idx) => new TableRow({
    children: [
      bodyCell(String(idx + 1), COL_WIDTHS[0], true),
      bodyCell(hariTanggalIndo(entry.tanggal), COL_WIDTHS[1]),
      bodyCell(entry.kegiatan, COL_WIDTHS[2]),
      bodyCell('', COL_WIDTHS[3], false, true)
    ]
  }));

  const table = new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: COL_WIDTHS,
    rows: [headerRow, ...bodyRows]
  });

  function formatName(name) {
    if (!name) return '-';
    return name.replace(/, /g, ',\u00A0').replace(/\. /g, '.\u00A0');
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_NAME,
            size: 24,
            color: theme.colors.text
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH_DXA, height: 16838 },
            margin: { top: MARGIN_DXA, bottom: MARGIN_DXA, left: MARGIN_DXA, right: MARGIN_DXA }
          }
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: 'JURNAL KEGIATAN PKL',
                bold: true,
                size: 28,
                font: FONT_NAME,
                color: theme.colors.primary
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: theme.colors.primary, space: 4 } },
            children: [
              new TextRun({
                text: `Periode: ${weekRangeLabel(weekKey, entries)}`,
                font: FONT_NAME,
                size: 22,
                color: theme.colors.muted
              })
            ]
          }),
          infoLine('Nama Peserta Didik', formatName(profile.namaPeserta)),
          infoLine('Dunia Kerja Tempat PKL', formatName(profile.tempatPkl)),
          infoLine('Nama Instruktur', formatName(profile.namaInstruktur)),
          infoLine('Nama Pembimbing PKL', formatName(profile.namaPembimbing)),
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          table,
          new Paragraph({
            spacing: { before: 240 },
            children: [
              new TextRun({
                text: '*) Catatan diberikan oleh Instruktur dunia kerja pada setiap kegiatan atau waktu tertentu',
                italics: true,
                size: 20,
                font: FONT_NAME,
                color: theme.colors.muted
              })
            ]
          })
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
}

module.exports = { generateWeekDocx };

