/* ---------------- Entry form (create / edit) ---------------- */
const dropzone = $('#dropzone');
const photoInput = $('#photos');

const customTemplateSelect = $('#customTemplateSelect');
if (customTemplateSelect) {
  const trigger = customTemplateSelect.querySelector('.custom-select-trigger');
  const options = customTemplateSelect.querySelectorAll('.custom-select-option');
  
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    customTemplateSelect.classList.toggle('open');
  });

  options.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = opt.getAttribute('data-value');
      customTemplateSelect.classList.remove('open');
      
      if (!val) return;

      let text = '';
      if (val === 'sarpras') {
        text = 'Melakukan perbaikan dan perawatan perangkat, seperti instalasi ulang sistem operasi pada komputer. Selain itu, membantu keperluan operasional sarana dan prasarana umum, misalnya mengganti lampu ruangan yang mati, serta memberikan bantuan teknis IT Support secara keseluruhan sesuai dengan arahan dari instruktur.';
      } else if (val === 'front_office') {
        text = 'Melayani tamu dan pengunjung yang datang ke area resepsionis dengan baik. Selain itu, melakukan pekerjaan administratif berupa pemindahan atau penginputan data pengunjung dari buku tamu fisik ke dalam format data Microsoft Excel.';
      } else if (val === 'perpustakaan') {
        text = 'Melakukan proses pendataan serta penginputan kelengkapan data buku perpustakaan ke dalam sistem database agar tercatat dengan rapi dan terstruktur.';
      }

      const textarea = $('#kegiatan');
      if (textarea.value.trim() === '') {
        textarea.value = text;
      } else {
        textarea.value += '\n\n' + text;
      }
      
      toast('Template teks berhasil ditambahkan ke isian', false);
    });
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!customTemplateSelect.contains(e.target)) {
      customTemplateSelect.classList.remove('open');
    }
  });
}

photoInput.addEventListener('change', (e) => {
  const incoming = Array.from(e.target.files);
  state.newPhotoFiles = [...state.newPhotoFiles, ...incoming];
  renderPhotoPreview();
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('dragover');
  });
});

['dragleave', 'dragend', 'drop'].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('dragover');
  });
});

dropzone.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  if (dt && dt.files && dt.files.length > 0) {
    const validFiles = Array.from(dt.files).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length > 0) {
      state.newPhotoFiles = [...state.newPhotoFiles, ...validFiles];
      renderPhotoPreview();
      toast(`${validFiles.length} foto berhasil ditambahkan`);
    }
  }
});

function renderPhotoPreview() {
  const container = $('#photoPreview');
  container.innerHTML = '';
  state.newPhotoFiles.forEach((file, index) => {
    const wrap = document.createElement('div');
    wrap.className = 'photo-chip';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.title = file.name;
    const btn = document.createElement('button');
    btn.className = 'remove-btn';
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;">close</span>';
    btn.type = 'button';
    btn.title = 'Hapus foto ini';
    btn.addEventListener('click', () => {
      state.newPhotoFiles.splice(index, 1);
      renderPhotoPreview();
    });
    wrap.appendChild(img);
    wrap.appendChild(btn);
    container.appendChild(wrap);
  });
}


function renderExistingPhotos(entry) {
  const container = $('#existingPhotos');
  container.innerHTML = '';
  (entry.photos || []).forEach((filename) => {
    if (state.removedExistingPhotos.includes(filename)) return;
    const wrap = document.createElement('div');
    wrap.className = 'photo-chip';
    const img = document.createElement('img');
    img.src = `/uploads/${filename}`;
    const btn = document.createElement('button');
    btn.className = 'remove-btn';
    btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;">close</span>';
    btn.type = 'button';
    btn.addEventListener('click', () => {
      state.removedExistingPhotos.push(filename);
      renderExistingPhotos(entry);
    });
    wrap.appendChild(img);
    wrap.appendChild(btn);
    container.appendChild(wrap);
  });
}

function resetForm() {
  $('#entryForm').reset();
  $('#entryId').value = '';
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  datePicker.setDate(todayStr);
  $('#formTitle').textContent = window.t ? window.t('modal.entry.titleAdd') : 'Tambah Catatan Harian';
  $('#btnSubmit').innerHTML = `<span class="material-symbols-outlined">save</span> ${window.t ? window.t('modal.entry.save') : 'Simpan Catatan'}`;
  $('#btnCancelEdit').style.display = 'none';
  $('#existingPhotos').innerHTML = '';
  $('#photoPreview').innerHTML = '';
  state.editingId = null;
  state.newPhotoFiles = [];
  state.removedExistingPhotos = [];
}

$('#btnCancelEdit').addEventListener('click', resetForm);

$('#btnAiRephrase').addEventListener('click', async () => {
  const textarea = $('#kegiatan');
  const statusEl = $('#aiStatus');
  const original = textarea.value;
  if (!original.trim()) {
    toast('Isi dulu kegiatannya sebelum minta bantuan AI', true);
    return;
  }
  const btn = $('#btnAiRephrase');
  btn.disabled = true;
  statusEl.classList.remove('error');
  statusEl.textContent = 'Sedang menyusun ulang teks dengan AI...';
  try {
    const result = await api('/api/ai/rephrase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: original })
    });
    textarea.value = result.text;
    textarea.dataset.previousValue = original;
    statusEl.textContent = 'Selesai — periksa lagi hasilnya sebelum disimpan.';
    toast('Teks berhasil dibuat variasi oleh AI');
  } catch (e) {
    statusEl.classList.add('error');
    statusEl.textContent = e.message;
    toast(e.message, true);
  } finally {
    btn.disabled = false;
  }
});

$('#entryForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData();
  fd.append('tanggal', $('#tanggal').value);
  fd.append('kegiatan', $('#kegiatan').value);
  state.newPhotoFiles.forEach((file) => fd.append('photos', file));

  const submitBtn = $('#btnSubmit');
  submitBtn.disabled = true;
  try {
    if (state.editingId) {
      if (state.removedExistingPhotos.length) {
        fd.append('removePhotos', JSON.stringify(state.removedExistingPhotos));
      }
      await api(`/api/entries/${state.editingId}`, { method: 'PUT', body: fd });
      toast('Catatan berhasil diperbarui');
    } else {
      await api('/api/entries', { method: 'POST', body: fd });
      toast('Catatan berhasil disimpan');
    }
    resetForm();
    loadEntries();
    closeModal($('#modalAddEntry'));
  } catch (e) {
    toast(e.message, true);
  } finally {
    submitBtn.disabled = false;
  }
});

function startEdit(entry) {
  state.editingId = entry.id;
  state.newPhotoFiles = [];
  state.removedExistingPhotos = [];
  datePicker.setDate(entry.tanggal);
  $('#kegiatan').value = entry.kegiatan;
  $('#photos').value = '';
  $('#photoPreview').innerHTML = '';
  renderExistingPhotos(entry);
  $('#formTitle').textContent = window.t ? window.t('modal.entry.titleEdit') : 'Edit Catatan Harian';
  $('#btnSubmit').innerHTML = `<span class="material-symbols-outlined">save</span> ${window.t ? window.t('modal.entry.save') : 'Perbarui Catatan'}`;
  $('#btnCancelEdit').style.display = 'inline-flex';
  $('#modalAddEntry').classList.add('open');
}

async function deleteEntry(id, force = false) {
  if (force) {
    if (!await customConfirm('Hapus permanen catatan ini? Foto yang terlampir juga akan terhapus selamanya.')) return;
    try {
      await api(`/api/entries/${id}?force=true`, { method: 'DELETE' });
      toast('Catatan dihapus permanen');
      loadEntries();
    } catch (e) { toast(e.message, true); }
  } else {
    // Soft delete immediately, show Undo toast
    try {
      await api(`/api/entries/${id}`, { method: 'DELETE' });
      loadEntries();
      
      toast('Catatan dipindahkan ke Tempat Sampah', false, {
        label: 'Urungkan',
        onClick: async () => {
          try {
            await api(`/api/entries/${id}/restore`, { method: 'PUT' });
            loadEntries();
            toast('Penghapusan dibatalkan');
          } catch (e) { toast(e.message, true); }
        }
      });
    } catch (e) { toast(e.message, true); }
  }
}

async function restoreEntry(id) {
  try {
    await api(`/api/entries/${id}/restore`, { method: 'PUT' });
    toast('Catatan dipulihkan');
    loadEntries();
  } catch (e) { toast(e.message, true); }
}

function getWeekKey(tanggal) {
  const [y, m, d] = tanggal.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dow = (dateObj.getDay() + 6) % 7;
  const monObj = new Date(dateObj);
  monObj.setDate(dateObj.getDate() - dow);
  return `${monObj.getFullYear()}-${String(monObj.getMonth() + 1).padStart(2, '0')}-${String(monObj.getDate()).padStart(2, '0')}`;
}

async function deleteBulkEntries(wKey, force = false) {
  const entriesInWeek = state.entries.filter(e => state.selectedEntries.has(e.id) && getWeekKey(e.tanggal) === wKey);
  if (entriesInWeek.length === 0) return;
  const msg = force
    ? `Hapus permanen ${entriesInWeek.length} catatan terpilih? Foto yang terlampir juga akan terhapus selamanya.`
    : `Pindahkan ${entriesInWeek.length} catatan terpilih ke Tempat Sampah?`;
  if (!confirm(msg)) return;
  
  try {
    const query = force ? '?force=true' : '';
    for (const entry of entriesInWeek) {
      await api(`/api/entries/${entry.id}${query}`, { method: 'DELETE' });
    }
    toast(`${entriesInWeek.length} catatan ${force ? 'dihapus permanen' : 'dipindahkan ke Tempat Sampah'}`);
    entriesInWeek.forEach(e => state.selectedEntries.delete(e.id));
    loadEntries();
  } catch (e) { toast(e.message, true); }
}

async function restoreBulkEntries(wKey) {
  const entriesInWeek = state.entries.filter(e => state.selectedEntries.has(e.id) && getWeekKey(e.tanggal) === wKey);
  if (entriesInWeek.length === 0) return;
  
  try {
    for (const entry of entriesInWeek) {
      await api(`/api/entries/${entry.id}/restore`, { method: 'PUT' });
    }
    toast(`${entriesInWeek.length} catatan dipulihkan`);
    entriesInWeek.forEach(e => state.selectedEntries.delete(e.id));
    loadEntries();
  } catch (e) { toast(e.message, true); }
}

function openBulkPreview(wKey) {
  const entriesInWeek = state.entries.filter(e => state.selectedEntries.has(e.id) && getWeekKey(e.tanggal) === wKey)
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  if (entriesInWeek.length === 0) return;

  state.currentPreviewDownload = null;
  
  $('#previewTitle').textContent = `Pratinjau: ${entriesInWeek.length} Catatan Terpilih`;
  $('#previewSubtitle').textContent = 'Pratinjau massal (Pengunduhan dari sini dinonaktifkan)';

  const profile = state.profile || {};
  let combinedHtml = '';

  entriesInWeek.forEach((entry, idx) => {
    const photoHtml = (entry.photos && entry.photos.length > 0)
      ? `<div class="doc-photo-grid">${entry.photos.map(p => `<img src="/uploads/${p}" alt="Dokumentasi">`).join('')}</div>`
      : '<p style="font-style:italic; color:#555; font-size:13px; margin: 4px 0 0;">(Tidak ada foto dokumentasi)</p>';

    combinedHtml += `
      ${idx > 0 ? '<hr class="doc-divider" style="margin: 30px 0;">' : ''}
      <div class="doc-header">
        <div class="doc-title">CATATAN KEGIATAN PKL</div>
        <div class="doc-subtitle">${entry.hari}, ${formatTanggalIndo(entry.tanggal)}</div>
      </div>
      <table class="doc-info-table">
        <tr><td class="label">Nama Peserta Didik</td><td class="colon">:</td><td>${escapeHtml(profile.namaPeserta || '-')}</td></tr>
        <tr><td class="label">Dunia Kerja Tempat PKL</td><td class="colon">:</td><td>${escapeHtml(profile.tempatPkl || '-')}</td></tr>
        <tr><td class="label">Nama Instruktur</td><td class="colon">:</td><td>${escapeHtml(profile.namaInstruktur || '-')}</td></tr>
        <tr><td class="label">Nama Pembimbing</td><td class="colon">:</td><td>${escapeHtml(profile.namaPembimbing || '-')}</td></tr>
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
          <div class="doc-signature-name">${escapeHtml(profile.namaInstruktur || '...........................................')}</div>
        </div>
      </div>
    `;
  });

  previewPaper.innerHTML = combinedHtml;
  
  $('#btnDownloadDocx').style.display = 'none';
  $('#btnDownloadPdf').style.display = 'none';
  
  $('#previewModal').classList.add('open');
}

function updateBulkActionVisibility() {
  $$('.week-group-item').forEach(weekItem => {
    const selectedInWeek = Array.from(weekItem.querySelectorAll('.entry-item.selected'));
    const bulkPill = weekItem.querySelector('.bulk-action-pill');
    if (bulkPill) {
      if (selectedInWeek.length > 0) {
        bulkPill.style.display = 'flex';
        bulkPill.classList.add('active');
      } else {
        bulkPill.style.display = 'none';
        bulkPill.classList.remove('active');
      }
    }
  });
}

function downloadFile(url) {
  const a = document.createElement('a');
  a.href = url;
  a.click();
}
