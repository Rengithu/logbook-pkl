/* ---------------- Mapel (Subjects) Management ---------------- */
const modalManageSubjects = $('#modalManageSubjects');

$('#menuManageSubjects')?.addEventListener('click', (e) => {
  e.stopPropagation();
  $('#fabMenu').classList.remove('open');
  renderSubjectList();
  modalManageSubjects.classList.add('open');
});

$('#btnCloseModalManageSubjects')?.addEventListener('click', () => {
  closeModal(modalManageSubjects);
});

function renderSubjectDropdown() {
  const optionsContainer = $('#customSubjectOptions');
  if (!optionsContainer) return;
  
  optionsContainer.innerHTML = '';
  
  const colors = ['#e91e63', '#9c27b0', '#3f51b5', '#009688', '#ff9800', '#795548', '#607d8b', '#f44336'];
  
  // Default empty option
  const defaultOpt = document.createElement('div');
  defaultOpt.className = 'custom-select-option';
  defaultOpt.innerHTML = `
    <div class="option-avatar" style="background: transparent; color: var(--fg-muted); font-size:16px;">
      <span class="material-symbols-outlined">block</span>
    </div>
    <div class="option-label">-- Kosongkan Mapel --</div>
  `;
  defaultOpt.addEventListener('click', (e) => {
    e.stopPropagation();
    $('#taskSubject').value = '';
    $('.custom-select-placeholder').textContent = '-- Pilih Mapel --';
    $('.custom-select-placeholder').style.color = 'var(--fg-muted)';
    customSelectWrapper.classList.remove('open');
    
    document.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
    defaultOpt.classList.add('selected');
  });
  optionsContainer.appendChild(defaultOpt);
  
  // Render subjects
  state.subjects.forEach((sub, i) => {
    const opt = document.createElement('div');
    opt.className = 'custom-select-option';
    
    // Generate avatar letter and color
    const letter = sub.name.charAt(0).toUpperCase();
    const color = colors[i % colors.length];
    
    opt.innerHTML = `
      <div class="option-avatar" style="background: ${color};">${letter}</div>
      <div class="option-label">${escapeHtml(sub.name)}</div>
    `;
    
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      $('#taskSubject').value = sub.name;
      $('.custom-select-placeholder').textContent = sub.name;
      $('.custom-select-placeholder').style.color = 'var(--fg-primary)';
      customSelectWrapper.classList.remove('open');
      
      document.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
    optionsContainer.appendChild(opt);
  });
}

function renderSubjectList() {
  const list = $('#subjectList');
  if (!list) return;
  list.innerHTML = '';
  
  let filteredSubjects = state.subjects;
  if (state.searchQuery) {
    filteredSubjects = filteredSubjects.filter(sub => sub.name.toLowerCase().includes(state.searchQuery));
  }
  
  if (filteredSubjects.length === 0) {
    list.innerHTML = '<p class="empty-state">Belum ada mapel (atau tidak ditemukan).</p>';
    return;
  }
  
  filteredSubjects.forEach(sub => {
    const item = document.createElement('div');
    item.className = 'subject-item';
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.padding = '8px 12px';
    item.style.background = 'var(--bg-elevated)';
    item.style.borderRadius = '6px';
    item.style.marginBottom = '8px';
    
    item.innerHTML = `
      <span style="font-size: 14px; font-weight: 500;">${escapeHtml(sub.name)}</span>
      <button class="btn-icon btn-icon-danger btn-sm" data-action="delete-subject" title="Hapus"><span class="material-symbols-outlined" style="font-size:16px;">delete</span></button>
    `;
    
    item.querySelector('[data-action="delete-subject"]').addEventListener('click', () => deleteSubject(sub.id));
    list.appendChild(item);
  });
}

$('#formAddSubject')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('#subjectName').value;
  try {
    const newSub = await api('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    state.subjects.push(newSub);
    $('#formAddSubject').reset();
    renderSubjectList();
    renderSubjectDropdown();
    toast('Mapel ditambahkan');
  } catch (err) { toast(err.message, true); }
});

async function deleteSubject(id) {
  try {
    await api(`/api/subjects/${id}`, { method: 'DELETE' });
    state.subjects = state.subjects.filter(s => s.id !== id);
    renderSubjectList();
    renderSubjectDropdown();
    
    toast('Mapel dipindahkan ke Tempat Sampah', false, {
      label: 'Urungkan',
      onClick: async () => {
        try {
          await api(`/api/subjects/${id}/restore`, { method: 'POST' });
          if (typeof loadSubjects === 'function') await loadSubjects();
          toast('Penghapusan mapel dibatalkan');
        } catch (e) { toast(e.message, true); }
      }
    });
  } catch (err) { toast(err.message, true); }
}

window.restoreTask = async function(id) {
  try {
    await api(`/api/tasks/${id}/restore`, { method: 'POST' });
    toast('Tugas dipulihkan.');
    loadEntries();
  } catch (e) { toast(e.message, true); }
};

window.deleteTaskForever = async function(id) {
  if (!await customConfirm('Hapus permanen tugas ini?')) return;
  try {
    await api(`/api/tasks/${id}/force`, { method: 'DELETE' });
    toast('Tugas permanen dihapus.');
    loadEntries();
  } catch (e) { toast(e.message, true); }
};

window.restoreSubject = async function(id) {
  try {
    await api(`/api/subjects/${id}/restore`, { method: 'POST' });
    toast('Mata pelajaran dipulihkan.');
    loadEntries();
  } catch (e) { toast(e.message, true); }
};

window.deleteSubjectForever = async function(id) {
  if (!await customConfirm('Hapus permanen mata pelajaran ini?')) return;
  try {
    await api(`/api/subjects/${id}/force`, { method: 'DELETE' });
    toast('Mata pelajaran permanen dihapus.');
    loadEntries();
  } catch (e) { toast(e.message, true); }
};

$('#btnEmptyTrash')?.addEventListener('click', async () => {
  if (!await customConfirm('Apakah kamu yakin ingin mengosongkan seluruh tempat sampah? Semua data di dalamnya akan dihapus secara permanen.')) return;
  
  try {
    const promises = [];
    (state.entries || []).forEach(e => promises.push(api(`/api/entries/${e.id}?force=true`, { method: 'DELETE' })));
    (state.trashedTasks || []).forEach(t => promises.push(api(`/api/tasks/${t.id}/force`, { method: 'DELETE' })));
    (state.trashedSubjects || []).forEach(s => promises.push(api(`/api/subjects/${s.id}/force`, { method: 'DELETE' })));
    
    if (promises.length === 0) {
      toast('Tempat sampah sudah kosong.');
      return;
    }
    
    await Promise.all(promises);
    toast('Tempat sampah berhasil dikosongkan.');
    loadEntries();
  } catch(e) {
    toast('Gagal mengosongkan tempat sampah.', true);
  }
});
