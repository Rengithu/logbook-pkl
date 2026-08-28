const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, ImageRun, TabStopType
} = require('docx');
const { hariTanggalIndo } = require('../utils/dateHelper');
const { loadScaledImage } = require('./imageHelper');
const theme = require('./theme');

const PAGE_WIDTH_DXA = 11906; // A4 width
const MARGIN_DXA = 1000;
const CONTENT_WIDTH_DXA = PAGE_WIDTH_DXA - MARGIN_DXA * 2;
const FONT_NAME = theme.fonts.base || 'Times New Roman';

function noBorder() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  };
}

function boxBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 4, color: theme.colors.border },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: theme.colors.border },
    left: { style: BorderStyle.SINGLE, size: 4, color: theme.colors.border },
    right: { style: BorderStyle.SINGLE, size: 4, color: theme.colors.border }
  };
}

function sectionLabel(letter, title) {
  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH_DXA],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: theme.colors.primary },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            borders: noBorder(),
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${letter}. ${title}`,
                    bold: true,
                    font: FONT_NAME,
                    color: 'FFFFFF',
                    size: 24
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function contentBox(children) {
  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH_DXA],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
            borders: boxBorder(),
            margins: { top: 160, bottom: 160, left: 160, right: 160 },
            children
          })
        ]
      })
    ]
  });
}

const INNER_WIDTH_DXA = CONTENT_WIDTH_DXA - 320; // account for contentBox margins

function writeLinesTable(numLines) {
  const rowBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: theme.colors.border }
  };
  const rows = [];
  for (let i = 0; i < numLines; i++) {
    rows.push(new TableRow({
      children: [
        new TableCell({
          width: { size: INNER_WIDTH_DXA, type: WidthType.DXA },
          borders: rowBorder,
          margins: { top: 220, bottom: 220, left: 0, right: 0 },
          children: [new Paragraph({ children: [new TextRun({ text: '', font: FONT_NAME })] })]
        })
      ]
    }));
  }
  return new Table({
    width: { size: INNER_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [INNER_WIDTH_DXA],
    rows
  });
}

function signatureBlock(namaInstruktur) {
  const spacerWidth = Math.round(CONTENT_WIDTH_DXA * 0.52);
  const blockWidth = CONTENT_WIDTH_DXA - spacerWidth;
  return new Table({
    width: { size: CONTENT_WIDTH_DXA, type: WidthType.DXA },
    columnWidths: [spacerWidth, blockWidth],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: spacerWidth, type: WidthType.DXA },
            borders: noBorder(),
            children: [new Paragraph({ children: [] })]
          }),
          new TableCell({
            width: { size: blockWidth, type: WidthType.DXA },
            borders: noBorder(),
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: 'Tanda Tangan Instruktur',
                    font: FONT_NAME,
                    size: 24,
                    color: theme.colors.text
                  })
                ]
              }),
              new Paragraph({
                spacing: { after: 1100 },
                children: [new TextRun({ text: '', font: FONT_NAME })]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: namaInstruktur || '...........................................',
                    bold: true,
                    font: FONT_NAME,
                    size: 24,
                    color: theme.colors.text
                  })
                ]
              })
            ]
          })
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

async function buildPhotoRows(photos) {
  if (!photos || photos.length === 0) {
    return [new Paragraph({ children: [new TextRun({ text: '(Tidak ada foto dokumentasi)', italics: true, color: theme.colors.muted, size: 20, font: FONT_NAME })] })];
  }
  const maxDim = 260;
  const runsPerRow = 2;
  const paragraphs = [];
  for (let i = 0; i < photos.length; i += runsPerRow) {
    const chunk = photos.slice(i, i + runsPerRow);
    const children = [];
    for (let idx = 0; idx < chunk.length; idx++) {
      const filename = chunk[idx];
      try {
        const { buffer, ext, width, height } = await loadScaledImage(filename, maxDim);
        children.push(new ImageRun({ data: buffer, type: ext === 'jpeg' ? 'jpg' : ext, transformation: { width, height } }));
        if (idx < chunk.length - 1) children.push(new TextRun({ text: '      ', font: FONT_NAME }));
      } catch (e) {
        children.push(new TextRun({ text: '[Foto tidak ditemukan]', italics: true, color: 'CC0000', font: FONT_NAME }));
      }
    }
    paragraphs.push(new Paragraph({ spacing: { after: 150 }, children }));
  }
  return paragraphs;
}

function formatName(name) {
  if (!name) return '-';
  return name.replace(/, /g, ',\u00A0').replace(/\. /g, '.\u00A0');
}

async function generateDayDocx(profile, entry) {
  const photoParagraphs = await buildPhotoRows(entry.photos);

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
                text: 'CATATAN KEGIATAN PKL',
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
                text: 'Praktik Kerja Lapangan',
                font: FONT_NAME,
                size: 22,
                color: theme.colors.muted
              })
            ]
          }),
          infoLine('Nama Peserta Didik', formatName(profile.namaPeserta)),
          infoLine('Dunia Kerja Tempat PKL', formatName(profile.tempatPkl)),
          infoLine('Nama Instruktur', formatName(profile.namaInstruktur)),
          infoLine('Nama Pembimbing', formatName(profile.namaPembimbing)),
          new Paragraph({ spacing: { after: 200 }, children: [] }),

          sectionLabel('A', 'Nama Pekerjaan'),
          contentBox([
            new Paragraph({
              spacing: { after: 60 },
              children: [new TextRun({ text: entry.kegiatan || '-', size: 24, font: FONT_NAME })]
            })
          ]),
          new Paragraph({ spacing: { after: 160 }, children: [] }),

          sectionLabel('B', 'Perencanaan Kegiatan'),
          contentBox([
            new Paragraph({
              children: [new TextRun({ text: hariTanggalIndo(entry.tanggal), size: 24, font: FONT_NAME })]
            })
          ]),
          new Paragraph({ spacing: { after: 160 }, children: [] }),

          sectionLabel('C', 'Pelaksanaan kegiatan / hasil'),
          contentBox([
            new Paragraph({
              spacing: { after: 150 },
              children: [new TextRun({ text: entry.kegiatan || '-', size: 24, font: FONT_NAME })]
            }),
            ...photoParagraphs
          ]),
          new Paragraph({ spacing: { after: 160 }, children: [] }),

          sectionLabel('D', 'Catatan Instruktur'),
          contentBox([writeLinesTable(1)]),
          new Paragraph({ spacing: { after: 500 }, children: [] }),

          signatureBlock(profile.namaInstruktur)
        ]
      }
    ]
  });

  return Packer.toBuffer(doc);
}

module.exports = { generateDayDocx };

