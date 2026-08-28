/* ---------------- Render entry list ---------------- */
async function loadEntries() {
  const list = $('#entryList');
  if (list) {
    let skeletonHTML = '';
    for (let i = 0; i < 4; i++) {
      skeletonHTML += `
        <div class="skeleton-card" style="margin-bottom: 12px;">
          <div class="skeleton-card-header">
            <div class="skeleton skeleton-text title" style="margin:0; width:40%;"></div>
            <div class="skeleton skeleton-avatar" style="width:24px; height:24px;"></div>
          </div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text medium"></div>
          <div style="display:flex; gap:8px; margin-top:8px;">
            <div class="skeleton skeleton-text short" style="width: 60px; height: 24px; border-radius: 99px;"></div>
            <div class="skeleton skeleton-text short" style="width: 80px; height: 24px; border-radius: 99px;"></div>
          </div>
        </div>
      `;
    }
    list.innerHTML = skeletonHTML;
  }
  const q = state.searchQuery ? `?q=${encodeURIComponent(state.searchQuery)}` : '';
  const url = state.currentView === 'trash' ? `/api/entries/trash${q}` : `/api/entries${q}`;
  
  try {
    if (state.currentView === 'trash') {
      const [entriesData, tasksData, subjectsData] = await Promise.all([
        api(url),
        api('/api/tasks/trash').catch(() => []),
        api('/api/subjects/trash').catch(() => [])
      ]);
      state.entries = entriesData;
      state.trashedTasks = tasksData;
      state.trashedSubjects = subjectsData;
    } else {
      const data = await api(url);
      state.entries = data;
      state.trashedTasks = [];
      state.trashedSubjects = [];
    }
    renderEntries();
    updateSidebarSummary();
    if (window.renderCalendar) window.renderCalendar();
    if (window.renderDashboard) window.renderDashboard();
  } catch (e) { toast(e.message, true); }
}

function updateSidebarSummary() {
  const totalEntries = state.entries ? state.entries.length : 0;
  const elTotal = document.getElementById('sidebarTotalEntries');
  if (elTotal) elTotal.textContent = totalEntries;
  
  const pendingTasks = state.tasks ? state.tasks.filter(t => t.status !== 'done').length : 0;
  const elPending = document.getElementById('sidebarPendingTasks');
  if (elPending) elPending.textContent = pendingTasks;
}
window.updateSidebarSummary = updateSidebarSummary;

async function loadSubjects() {
  try {
    const data = await api('/api/subjects');
    state.subjects = data;
    renderSubjectDropdown();
  } catch (e) { toast(e.message, true); }
}

document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(state.currentTheme);
  loadProfile();
  
  // Load all data concurrently for Dashboard
  await Promise.all([
    loadEntries(),
    loadSubjects(),
    loadTasks()
  ]);
  
  renderDashboard();

  // Setup View Toggle
  const viewToggle = document.getElementById('entriesViewToggle');
  if (viewToggle) {
    viewToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      const view = btn.dataset.view;
      if (view && view !== state.entriesViewMode) {
        state.entriesViewMode = view;
        localStorage.setItem('pkl_entries_view', view);
        renderEntries();
      }
    });
  }
});

function renderEntries() {
  const list = $('#entryList');
  if (!list) return;
  const scrollPos = list.scrollTop;
  list.innerHTML = '';
  
  const headerTitle = $('#tab-entries .page-title') || $('#tab-entries .card-header-row h2');
  const headerSubtitle = $('#tab-entries .hint');
  if (headerTitle) {
    headerTitle.textContent = state.currentView === 'trash' ? (window.t ? window.t('trash.title') : 'Tempat Sampah') : (window.t ? window.t('entries.title') : 'Daftar Catatan');
  }
  if (headerSubtitle) {
    headerSubtitle.textContent = state.currentView === 'trash' ? (window.t ? window.t('trash.subtitle') : 'Lihat dan pulihkan catatan yang telah dihapus.') : (window.t ? window.t('entries.subtitle') : 'Catat dan kelola aktivitas harianmu selama PKL di sini.');
  }
  
  const viewToggle = $('#entriesViewToggle');
  if (viewToggle) {
    viewToggle.querySelectorAll('.seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === state.entriesViewMode);
    });
  }
  
  const btnEmptyTrash = $('#btnEmptyTrash');
  if (btnEmptyTrash) {
    btnEmptyTrash.style.display = state.currentView === 'trash' ? 'inline-flex' : 'none';
  }
  
  // Ensure there's a divider under the header row if not already there
  let headerDivider = $('#tab-entries .card-header-divider');
  if (!headerDivider) {
    headerDivider = document.createElement('div');
    headerDivider.className = 'card-header-divider';
    const headerRow = $('#tab-entries .page-header') || $('#tab-entries .card-header-row');
    if (headerRow) {
      headerRow.insertAdjacentElement('afterend', headerDivider);
    }
  }

  const q = state.searchQuery || '';
  const filteredEntries = state.entries.filter(e => {
    if (!q) return true;
    return (e.kegiatan && e.kegiatan.toLowerCase().includes(q)) || 
           (e.hari && e.hari.toLowerCase().includes(q)) ||
           (e.tanggal && e.tanggal.includes(q));
  });

  $('#entryCount').textContent = `${filteredEntries.length} ${window.t ? window.t('entries.count') : 'entri'}`;
  if (state.currentView === 'trash') {
    $('#emptyEntries').textContent = 'Tempat sampah kosong.';
  } else {
    $('#emptyEntries').textContent = window.t ? window.t('entries.empty') || 'Belum ada catatan.' : 'Belum ada catatan.';
  }
  $('#emptyEntries').style.display = filteredEntries.length ? 'none' : 'block';

  const weekMap = {};
  filteredEntries.forEach((entry) => {
    const monKey = getWeekKey(entry.tanggal);
    if (!weekMap[monKey]) {
      weekMap[monKey] = [];
    }
    weekMap[monKey].push(entry);
  });

  // Sort weeks descending (newest week first)
  const sortedWeekKeys = Object.keys(weekMap).sort((a, b) => b.localeCompare(a));

  sortedWeekKeys.forEach((wKey, wIdx) => {
    const entriesInWeek = weekMap[wKey].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    const weekItem = document.createElement('div');
    weekItem.className = 'week-group-item';

    weekItem.innerHTML = `
      <div class="week-group-header">
        <div class="week-group-info">
          <div class="week-title-row">
            <span class="material-symbols-outlined week-icon">date_range</span>
            <span class="week-title-text">${window.t ? window.t('entries.week') : 'Minggu'} ${weekRangeLabelClient(wKey, entriesInWeek)}</span>
          </div>
          <div class="week-subtitle">
            <span class="material-symbols-outlined" style="font-size: 14px; margin-right: 4px; vertical-align: middle;">event_note</span>
            ${entriesInWeek.length} ${window.t ? window.t('entries.dailyCount') : 'catatan harian'}
          </div>
        </div>
        <div class="week-group-actions">
          <div class="bulk-action-pill" style="display: none;">
            ${state.currentView === 'trash' ? `
             <button class="pill-btn" data-action="bulk-restore" title="Pulihkan Terpilih"><span class="material-symbols-outlined">restore_from_trash</span></button>
             <div class="pill-divider"></div>
             <button class="pill-btn" style="color: var(--danger);" data-action="bulk-delete-forever" title="Hapus Permanen Terpilih"><span class="material-symbols-outlined">delete_forever</span></button>
            ` : `
             <button class="pill-btn" data-action="bulk-preview" title="Pratinjau Terpilih"><span class="material-symbols-outlined">visibility</span></button>
             <div class="pill-divider"></div>
             <button class="pill-btn" data-action="bulk-pdf" title="Unduh PDF Terpilih"><span class="material-symbols-outlined">picture_as_pdf</span></button>
             <div class="pill-divider"></div>
             <button class="pill-btn" style="color: var(--danger);" data-action="bulk-delete" title="Hapus Terpilih"><span class="material-symbols-outlined">delete</span></button>
            `}
          </div>
          ${state.currentView === 'trash' ? '' : `
          <button class="btn btn-outline-primary btn-sm" data-action="week-preview" title="Pratinjau Jurnal Mingguan">
            <span class="material-symbols-outlined">visibility</span>
            <span>${window.t ? window.t('entries.preview') : 'Pratinjau'}</span>
          </button>
          `}
          <button type="button" class="btn-expand-arrow week-arrow" title="Buka / Tutup Minggu">
            <span class="material-symbols-outlined arrow-icon">expand_more</span>
          </button>
        </div>
      </div>
      <div class="week-group-body ${state.entriesViewMode === 'grid' ? 'entries-grid-mode' : ''}"></div>
    `;

    // Toggle parent week expand/collapse
    const weekHeader = weekItem.querySelector('.week-group-header');
    weekHeader.addEventListener('click', (e) => {
      if (e.target.closest('.dropdown') || e.target.closest('.bulk-action-pill')) return;
      weekItem.classList.toggle('expanded');
      
      if (!weekItem.classList.contains('expanded')) {
        const selectedItems = weekItem.querySelectorAll('.entry-item.selected');
        if (selectedItems.length > 0) {
          selectedItems.forEach(item => {
            item.classList.remove('selected');
            const id = isNaN(item.dataset.id) ? item.dataset.id : Number(item.dataset.id);
            state.selectedEntries.delete(id);
          });
          updateBulkActionVisibility();
        }
      }
    });

    if (state.currentView !== 'trash') {
      weekItem.querySelector('[data-action="week-preview"]').addEventListener('click', (e) => {
        e.stopPropagation();
        openWeekPreview(wKey);
      });
      
      weekItem.querySelector('[data-action="bulk-preview"]').addEventListener('click', (e) => {
        e.stopPropagation();
        openBulkPreview(wKey);
      });
      weekItem.querySelector('[data-action="bulk-pdf"]').addEventListener('click', (e) => {
        e.stopPropagation();
        toast('Fitur unduh PDF Massal sedang disiapkan!');
      });
      weekItem.querySelector('[data-action="bulk-delete"]').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteBulkEntries(wKey);
      });
    } else {
      weekItem.querySelector('[data-action="bulk-restore"]').addEventListener('click', (e) => {
        e.stopPropagation();
        restoreBulkEntries(wKey);
      });
      weekItem.querySelector('[data-action="bulk-delete-forever"]').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteBulkEntries(wKey, true); // force=true
      });
    }
    const weekBody = weekItem.querySelector('.week-group-body');

    // Render Child Day entries
    entriesInWeek.forEach((entry, dIdx) => {
      const hol = getHoliday(entry.tanggal);
      const holBadge = hol
        ? `<span class="badge" style="background:${hol.type === 'bali' ? 'rgba(254,128,25,0.15)' : 'var(--danger-bg)'}; color:${hol.type === 'bali' ? 'var(--accent-orange)' : 'var(--danger)'}; border-color:${hol.type === 'bali' ? 'rgba(254,128,25,0.3)' : 'var(--danger-border)'}; font-size:11px; margin-left:6px;"><span class="material-symbols-outlined" style="font-size:13px; vertical-align:middle;">${hol.type === 'bali' ? 'temple_hindu' : 'celebration'}</span> ${escapeHtml(hol.name)}</span>`
        : '';

      const photosHtml = (entry.photos && entry.photos.length > 0)
        ? `<div class="entry-photos-preview">${entry.photos.map(p => `<img src="/uploads/${p}" alt="Foto" title="Dokumentasi">`).join('')}</div>`
        : '';

      const dayItem = document.createElement('div');
      dayItem.className = 'entry-item';
      dayItem.dataset.id = entry.id;
      if (state.selectedEntries.has(entry.id)) {
        dayItem.classList.add('selected');
      }

      dayItem.innerHTML = `
        <div class="entry-header-row">
          <div class="entry-date-group">
            <span class="material-symbols-outlined entry-date-icon">event</span>
            <span class="entry-date-text">${entry.hari}, ${formatTanggalIndo(entry.tanggal)}</span>
            ${holBadge}
          </div>
          <div class="entry-header-right">

            <button type="button" class="btn-expand-arrow" title="Buka / Tutup Detail">
              <span class="material-symbols-outlined arrow-icon">expand_more</span>
            </button>
          </div>
        </div>
        <div class="entry-expand-body">
          <div class="entry-job">${escapeHtml(entry.kegiatan)}</div>
          ${photosHtml}
          <div class="entry-actions-row">
            ${state.currentView === 'trash' ? `
            <div class="icon-actions-group" style="margin-left: auto;">
              <button class="btn-icon" data-action="restore" title="Pulihkan Catatan">
                <span class="material-symbols-outlined">restore_from_trash</span>
              </button>
              <div class="icon-divider"></div>
              <button class="btn-icon btn-icon-danger" data-action="delete-forever" title="Hapus Permanen">
                <span class="material-symbols-outlined">delete_forever</span>
              </button>
            </div>
            ` : `
            <div class="icon-actions-group" style="margin-left: auto;">
              <button class="btn-icon" data-action="preview" title="Pratinjau Dokumen">
                <span class="material-symbols-outlined">visibility</span>
              </button>
              <div class="icon-divider"></div>
              <button class="btn-icon" data-action="download" title="Unduh Catatan">
                <span class="material-symbols-outlined">download</span>
              </button>
              <div class="icon-divider"></div>
              <button class="btn-icon" data-action="edit" title="Edit Catatan">
                <span class="material-symbols-outlined">edit</span>
              </button>
              <div class="icon-divider"></div>
              <button class="btn-icon btn-icon-danger" data-action="delete" title="Hapus Catatan">
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
            `}
          </div>
        </div>
      `;

      const dayHeader = dayItem.querySelector('.entry-header-row');
      dayHeader.addEventListener('click', (e) => {
        if (e.target.closest('.dropdown') || e.target.closest('.btn-outline-primary') || e.target.closest('.btn-tonal') || e.target.closest('.icon-actions-group')) return;
        
        if (e.target.closest('.btn-expand-arrow')) {
          dayItem.classList.toggle('expanded');
          return;
        }
        
        if (state.selectedEntries.has(entry.id)) {
          state.selectedEntries.delete(entry.id);
          dayItem.classList.remove('selected');
        } else {
          state.selectedEntries.add(entry.id);
          dayItem.classList.add('selected');
        }
        updateBulkActionVisibility();
      });

      if (state.currentView !== 'trash') {
        dayItem.querySelector('[data-action="preview"]').addEventListener('click', (e) => {
          e.stopPropagation();
          openDayPreview(entry);
        });
        dayItem.querySelector('[data-action="download"]').addEventListener('click', (e) => {
          e.stopPropagation();
          window.open(`/api/export/day/${entry.id}/pdf`, '_blank');
        });
        dayItem.querySelector('[data-action="edit"]').addEventListener('click', () => startEdit(entry));
        dayItem.querySelector('[data-action="delete"]').addEventListener('click', () => deleteEntry(entry.id));
      } else {
        dayItem.querySelector('[data-action="restore"]').addEventListener('click', () => restoreEntry(entry.id));
        dayItem.querySelector('[data-action="delete-forever"]').addEventListener('click', () => deleteEntry(entry.id, true));
      }

      weekBody.appendChild(dayItem);
    });

    list.appendChild(weekItem);
  });
  updateBulkActionVisibility();

  const qTrash = state.searchQuery || '';
  const filteredTrashedTasks = state.trashedTasks.filter(t => !qTrash || t.title.toLowerCase().includes(qTrash));
  
  if (state.currentView === 'trash' && filteredTrashedTasks?.length > 0) {
    const tasksGroup = document.createElement('div');
    tasksGroup.className = 'week-group-item';
    tasksGroup.innerHTML = `
      <div class="week-group-header" style="background: var(--bg-surface);">
        <div class="week-group-title" style="color: var(--warning);">
          <span class="material-symbols-outlined">task</span>
          Tugas Terhapus (${filteredTrashedTasks.length})
        </div>
      </div>
      <div class="week-group-body"></div>
    `;
    const tBody = tasksGroup.querySelector('.week-group-body');
    filteredTrashedTasks.forEach(t => {
      const tItem = document.createElement('div');
      tItem.className = 'entry-day-item';
      tItem.innerHTML = `
        <div class="entry-header-row">
          <div class="entry-header-left">
            <h4 style="margin:0; font-size:15px; color:var(--fg-primary);">${escapeHtml(t.title)}</h4>
            <div style="font-size:12px; color:var(--fg-secondary); margin-top:4px;">Kategori: ${escapeHtml(t.category)}</div>
          </div>
          <div class="entry-header-right">
            <button class="btn btn-outline-primary btn-sm" onclick="restoreTask('${t.id}')" title="Pulihkan">
              <span class="material-symbols-outlined">restore_from_trash</span> Pulihkan
            </button>
            <button class="btn-icon btn-icon-danger" onclick="deleteTaskForever('${t.id}')" title="Hapus Permanen">
              <span class="material-symbols-outlined">delete_forever</span>
            </button>
          </div>
        </div>
      `;
      tBody.appendChild(tItem);
    });
    list.appendChild(tasksGroup);
  }

  const filteredTrashedSubjects = state.trashedSubjects?.filter(s => !qTrash || s.name.toLowerCase().includes(qTrash)) || [];
  
  if (state.currentView === 'trash' && filteredTrashedSubjects.length > 0) {
    const subsGroup = document.createElement('div');
    subsGroup.className = 'week-group-item';
    subsGroup.innerHTML = `
      <div class="week-group-header" style="background: var(--bg-surface);">
        <div class="week-group-title" style="color: var(--primary);">
          <span class="material-symbols-outlined">library_books</span>
          Mata Pelajaran Terhapus (${filteredTrashedSubjects.length})
        </div>
      </div>
      <div class="week-group-body"></div>
    `;
    const sBody = subsGroup.querySelector('.week-group-body');
    filteredTrashedSubjects.forEach(s => {
      const sItem = document.createElement('div');
      sItem.className = 'entry-day-item';
      sItem.innerHTML = `
        <div class="entry-header-row">
          <div class="entry-header-left">
            <h4 style="margin:0; font-size:15px; color:var(--fg-primary);">${escapeHtml(s.name)}</h4>
          </div>
          <div class="entry-header-right">
            <button class="btn btn-outline-primary btn-sm" onclick="restoreSubject('${s.id}')" title="Pulihkan">
              <span class="material-symbols-outlined">restore_from_trash</span> Pulihkan
            </button>
            <button class="btn-icon btn-icon-danger" onclick="deleteSubjectForever('${s.id}')" title="Hapus Permanen">
              <span class="material-symbols-outlined">delete_forever</span>
            </button>
          </div>
        </div>
      `;
      sBody.appendChild(sItem);
    });
    list.appendChild(subsGroup);
  }
  
  // Restore scroll position
  list.scrollTop = scrollPos;
}

