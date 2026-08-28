/* ---------------- Document Preview Logic ---------------- */
const modal = $('#previewModal');
const previewPaper = $('#previewPaper');
const btnClose = $('#btnClosePreview');
const btnDocx = $('#btnDownloadDocx');
const btnPdf = $('#btnDownloadPdf');

btnClose.addEventListener('click', () => {
  closeModal(modal);
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal(modal);
});

btnDocx.addEventListener('click', () => {
  if (state.currentPreviewDownload?.docx) {
    downloadFile(state.currentPreviewDownload.docx);
  }
});

btnPdf.addEventListener('click', () => {
  if (state.currentPreviewDownload?.pdf) {
    downloadFile(state.currentPreviewDownload.pdf);
  }
});

function openDayPreview(entry) {
  state.currentPreviewDownload = {
    docx: `/api/export/day/${entry.id}/docx`,
    pdf: `/api/export/day/${entry.id}/pdf`
  };
  $('#btnDownloadDocx').style.display = 'inline-flex';
  $('#btnDownloadPdf').style.display = 'inline-flex';

  $('#previewTitle').textContent = `Pratinjau: Catatan ${entry.hari}, ${formatTanggalIndo(entry.tanggal)}`;
  $('#previewSubtitle').textContent = 'Format resmi Catatan Kegiatan PKL (Word & PDF)';

  const profile = state.profile || {};
  const photoHtml = (entry.photos && entry.photos.length > 0)
    ? `<div class="doc-photo-grid">${entry.photos.map(p => `<img src="/uploads/${p}" alt="Dokumentasi">`).join('')}</div>`
    : '<p style="font-style:italic; color:#555; font-size:13px; margin: 4px 0 0;">(Tidak ada foto dokumentasi)</p>';

  previewPaper.innerHTML = `
    <div class="doc-header">
      <div class="doc-title">CATATAN KEGIATAN PKL</div>
      <div class="doc-subtitle">Praktik Kerja Lapangan</div>
      <hr class="doc-divider">
    </div>

    <table class="doc-info-table">
      <tr>
        <td class="label">Nama Peserta Didik</td>
        <td class="colon">:</td>
        <td>${escapeHtml(profile.namaPeserta || '-')}</td>
      </tr>
      <tr>
        <td class="label">Dunia Kerja Tempat PKL</td>
        <td class="colon">:</td>
        <td>${escapeHtml(profile.tempatPkl || '-')}</td>
      </tr>
      <tr>
        <td class="label">Nama Instruktur</td>
        <td class="colon">:</td>
        <td>${escapeHtml(profile.namaInstruktur || '-')}</td>
      </tr>
      <tr>
        <td class="label">Nama Pembimbing</td>
        <td class="colon">:</td>
        <td>${escapeHtml(profile.namaPembimbing || '-')}</td>
      </tr>
    </table>

    <div class="doc-section">
      <div class="doc-section-header">A. Nama Pekerjaan</div>
      <div class="doc-section-content">
        <div>${escapeHtml(entry.kegiatan || '-')}</div>
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-header">B. Perencanaan Kegiatan</div>
      <div class="doc-section-content">
        ${entry.hari}, ${formatTanggalIndo(entry.tanggal)}
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-header">C. Pelaksanaan kegiatan / hasil</div>
      <div class="doc-section-content">
        <div>${escapeHtml(entry.kegiatan || '-')}</div>
        ${photoHtml}
      </div>
    </div>

    <div class="doc-section">
      <div class="doc-section-header">D. Catatan Instruktur</div>
      <div class="doc-section-content">
        <div class="doc-write-lines"></div>
      </div>
    </div>

    <div class="doc-signature-wrapper">
      <div class="doc-signature-box">
        <div class="doc-signature-title">Tanda Tangan Instruktur</div>
        <div class="doc-signature-name">${(escapeHtml(profile.namaInstruktur || '...........................................')).replace(',', ',<br>')}</div>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

async function openWeekPreview(weekKey) {
  state.currentPreviewDownload = {
    docx: `/api/export/week/${weekKey}/docx`,
    pdf: `/api/export/week/${weekKey}/pdf`
  };
  $('#btnDownloadDocx').style.display = 'inline-flex';
  $('#btnDownloadPdf').style.display = 'inline-flex';

  const entries = state.entries
    .filter(e => {
      const [y, m, d] = e.tanggal.split('-').map(Number);
      const cur = new Date(y, m - 1, d);
      const dow = (cur.getDay() + 6) % 7;
      cur.setDate(cur.getDate() - dow);
      const monKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
      return monKey === weekKey;
    })
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  $('#previewTitle').textContent = `Pratinjau: Jurnal Minggu ${weekRangeLabelClient(weekKey, entries)}`;
  $('#previewSubtitle').textContent = 'Format resmi Jurnal Kegiatan PKL Rekap Mingguan';

  const profile = state.profile || {};

  const rowsHtml = entries.map((e, idx) => `
    <tr>
      <td class="center">${idx + 1}</td>
      <td>${e.hari}, ${formatTanggalIndo(e.tanggal)}</td>
      <td>${escapeHtml(e.kegiatan)}</td>
      <td></td>
    </tr>
  `).join('');

  previewPaper.innerHTML = `
    <div class="doc-header">
      <div class="doc-title">JURNAL KEGIATAN PKL</div>
      <div class="doc-subtitle">Periode: ${weekRangeLabelClient(weekKey, entries)}</div>
      <hr class="doc-divider">
    </div>

    <table class="doc-info-table">
      <tr>
        <td class="label">Nama Peserta Didik</td>
        <td class="colon">:</td>
        <td>${escapeHtml(profile.namaPeserta || '-')}</td>
      </tr>
      <tr>
        <td class="label">Dunia Kerja Tempat PKL</td>
        <td class="colon">:</td>
        <td>${escapeHtml(profile.tempatPkl || '-')}</td>
      </tr>
      <tr>
        <td class="label">Nama Instruktur</td>
        <td class="colon">:</td>
        <td>${escapeHtml(profile.namaInstruktur || '-')}</td>
      </tr>
      <tr>
        <td class="label">Nama Pembimbing PKL</td>
        <td class="colon">:</td>
        <td>${escapeHtml(profile.namaPembimbing || '-')}</td>
      </tr>
    </table>

    <table class="doc-table">
      <thead>
        <tr>
          <th style="width: 38px;">No</th>
          <th style="width: 170px;">Hari / Tanggal</th>
          <th>Unit Kerja / Pekerjaan</th>
          <th style="width: 140px;">Catatan</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="4" class="center">Tidak ada entri catatan minggu ini</td></tr>'}
      </tbody>
    </table>

    <div class="doc-table-footnote">
      *) Catatan diberikan oleh Instruktur dunia kerja pada setiap kegiatan atau waktu tertentu
    </div>
  `;

  modal.classList.add('open');
}
