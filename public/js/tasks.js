/* ---------------- Task Manager (Kanban) ---------------- */
async function loadTasks() {
  const container = $('#taskListContainer');
  if (container) {
    let skeletonHTML = '';
    for (let i = 0; i < 4; i++) {
      skeletonHTML += `
        <div class="skeleton-row">
          <div class="skeleton skeleton-text" style="width: 24px; height: 24px; border-radius: 4px; margin: 0;"></div>
          <div style="flex:1;">
            <div class="skeleton skeleton-text" style="width: 60%; margin-bottom: 4px;"></div>
            <div class="skeleton skeleton-text short" style="margin: 0; height: 12px;"></div>
          </div>
          <div class="skeleton skeleton-text" style="width: 80px; margin: 0; border-radius: 99px; height: 24px;"></div>
        </div>
      `;
    }
    container.innerHTML = skeletonHTML;
  }
  try {
    const tasks = await api('/api/tasks');
    state.tasks = tasks;
    renderTasks();
    if (window.renderCalendar) window.renderCalendar();
    if (window.renderDashboard) window.renderDashboard();
  } catch (e) { toast(e.message, true); }
}

function renderTasks() {
  if (window.updateSidebarSummary) window.updateSidebarSummary();
  
  const container = $('#taskListContainer');
  if (!container) return;
  
  const scrollPos = container.scrollTop;
  container.innerHTML = '';
  
  // Filtering logic
  let filteredTasks = state.tasks || [];
  if (state.taskFilter !== 'all') {
    if (state.taskFilter === 'status_todo') {
      filteredTasks = filteredTasks.filter(t => t.status === 'todo');
    } else if (state.taskFilter === 'status_in_progress') {
      filteredTasks = filteredTasks.filter(t => t.status === 'in_progress');
    } else if (state.taskFilter === 'status_done') {
      filteredTasks = filteredTasks.filter(t => t.status === 'done');
    }
  }
  
  if (state.searchQuery) {
    filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(state.searchQuery));
  }

  // Sorting logic
  let sortedTasks = [...filteredTasks];
  sortedTasks.sort((a, b) => {
    switch (state.taskSort) {
      case 'title_asc': return a.title.localeCompare(b.title);
      case 'title_desc': return b.title.localeCompare(a.title);
      case 'date_asc':
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      case 'status_asc':
        const statusOrder = { 'todo': 1, 'in_progress': 2, 'done': 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      default: return 0;
    }
  });
  
  if (sortedTasks.length === 0) {
    container.innerHTML = `<p class="empty-state">${window.t ? window.t('tasks.empty') || 'Belum ada tugas.' : 'Belum ada tugas.'}</p>`;
    return;
  }
  
  const colors = ['#e91e63', '#9c27b0', '#3f51b5', '#009688', '#ff9800', '#795548', '#607d8b', '#f44336'];
  
  sortedTasks.forEach(task => {
    const row = document.createElement('div');
    row.className = 'task-row';
    
    // Icon based on mapel or generic
    let iconLetter = 'T';
    let iconColor = '#83a598'; // Default generic color
    let subjectText = '-';
    
    if (task.subject) {
      subjectText = escapeHtml(task.subject);
      iconLetter = task.subject.charAt(0).toUpperCase();
      // Deterministic color based on subject name length just for visual variety
      iconColor = colors[task.subject.length % colors.length];
    }
    
    // Status Display
    let statusDisplay = '';
    if (task.status === 'todo') statusDisplay = `<span class="status-badge status-todo">${window.t ? window.t('tasks.status.todo') : 'Belum Mulai'}</span>`;
    else if (task.status === 'in_progress') statusDisplay = `<span class="status-badge status-in-progress">${window.t ? window.t('tasks.status.inProgress') : 'Proses'}</span>`;
    else if (task.status === 'done') statusDisplay = `<span class="status-badge status-done">${window.t ? window.t('tasks.status.done') : 'Selesai'}</span>`;
    
    // Deadline Display
    let deadlineHtml = '-';
    if (task.deadline) {
      const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'done';
      deadlineHtml = `<span class="task-deadline ${isOverdue ? 'overdue' : ''}">${formatTanggalIndo(task.deadline)}</span>`;
    }
    
    row.innerHTML = `
      <div class="list-col col-name task-title" style="min-width: 0; align-items: flex-start; padding-top: 12px; padding-bottom: 12px;">
        <div class="task-icon-circle" style="background: ${iconColor}; flex-shrink: 0; margin-top: 2px;">${iconLetter}</div>
        <div style="display:flex; flex-direction:column; min-width:0; width:100%; gap:4px;">
          <span title="${escapeHtml(task.title)}" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; width: 100%; font-weight: 500;">${escapeHtml(task.title)}</span>
          ${task.description ? `<div style="font-size:12px; color:var(--fg-muted); white-space: normal; line-height:1.4;">${escapeHtml(task.description)}</div>` : ''}
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${task.referenceUrl ? `<a href="${escapeHtml(task.referenceUrl)}" target="_blank" title="${escapeHtml(task.referenceUrl)}" style="font-size:12px; color:var(--primary); display:inline-flex; align-items:center; gap:4px; text-decoration:none; background:var(--bg-elevated); padding:2px 8px; border-radius:4px; border:1px solid var(--border);"><span class="material-symbols-outlined" style="font-size:14px;">link</span>Link</a>` : ''}
            ${task.attachmentPath ? `<a href="/uploads/${escapeHtml(task.attachmentPath)}" target="_blank" download="${escapeHtml(task.attachmentName)}" title="${escapeHtml(task.attachmentName)}" style="font-size:12px; color:var(--fg-secondary); display:inline-flex; align-items:center; gap:4px; text-decoration:none; background:var(--bg-elevated); padding:2px 8px; border-radius:4px; border:1px solid var(--border);"><span class="material-symbols-outlined" style="font-size:14px;">attach_file</span>File</a>` : ''}
          </div>
        </div>
      </div>
      <div class="list-col col-subject task-subject">${subjectText}</div>
      <div class="list-col col-date">${deadlineHtml}</div>
      <div class="list-col col-status">${statusDisplay}</div>
      <div class="list-col col-action">
        <div style="position: relative; display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
          <button class="btn-icon btn-sm" data-action="edit-task" title="Edit Tugas"><span class="material-symbols-outlined" style="font-size:18px;">edit</span></button>
          <button class="btn-icon btn-icon-danger btn-sm" data-action="delete" title="Hapus"><span class="material-symbols-outlined" style="font-size:18px;">delete</span></button>
          <button class="btn-icon btn-sm" data-action="change-status" title="Ubah Status"><span class="material-symbols-outlined" style="font-size:18px;">sync_alt</span></button>
        </div>
      </div>
    `;
    
    row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteTask(task.id));
    row.querySelector('[data-action="change-status"]').addEventListener('click', () => {
      // Simple toggle logic for status
      let nextStatus = 'todo';
      if (task.status === 'todo') nextStatus = 'in_progress';
      else if (task.status === 'in_progress') nextStatus = 'done';
      else if (task.status === 'done') nextStatus = 'todo';
      updateTaskStatus(task.id, nextStatus);
    });
    row.querySelector('[data-action="edit-task"]').addEventListener('click', () => {
      $('#modalAddTask .modal-title').textContent = window.t ? window.t('modal.task.titleEdit') : 'Edit Tugas';
      $('#taskId').value = task.id;
      $('#taskTitle').value = task.title;
      
      if (task.deadline) {
        $('#taskDeadline').value = task.deadline;
      } else {
        $('#taskDeadline').value = '';
      }
      
      if (task.subject) {
        $('#taskSubject').value = task.subject;
        $('.custom-select-placeholder').textContent = task.subject;
        $('.custom-select-placeholder').style.color = 'var(--fg-primary)';
      } else {
        $('#taskSubject').value = '';
        $('.custom-select-placeholder').textContent = '-- Pilih Mapel --';
        $('.custom-select-placeholder').style.color = 'var(--fg-muted)';
      }
      
      $('#taskDescription').value = task.description || '';
      $('#taskReferenceUrl').value = task.referenceUrl || '';
      $('#taskAttachment').value = ''; // Cannot prepopulate file input
      
      $('#modalAddTask').classList.add('open');
    });
    
    container.appendChild(row);
  });
  
  // Restore scroll position to prevent jumping
  container.scrollTop = scrollPos;
}

async function updateTaskStatus(id, newStatus) {
  try {
    const updated = await api(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const idx = state.tasks.findIndex(t => t.id === id);
    if (idx !== -1) state.tasks[idx] = updated;
    renderTasks();
  } catch (e) { toast(e.message, true); }
}

async function deleteTask(id) {
  try {
    await api(`/api/tasks/${id}`, { method: 'DELETE' });
    state.tasks = state.tasks.filter(t => t.id !== id);
    renderTasks();
    
    toast('Tugas dipindahkan ke Tempat Sampah', false, {
      label: 'Urungkan',
      onClick: async () => {
        try {
          await api(`/api/tasks/${id}/restore`, { method: 'POST' });
          if (typeof loadTasks === 'function') await loadTasks();
          toast('Penghapusan tugas dibatalkan');
        } catch (e) { toast(e.message, true); }
      }
    });
  } catch (e) { toast(e.message, true); }
}

/* Modal Add Task (Listeners updated to use FAB Menu) */
const modalAddTask = $('#modalAddTask');
$('#btnCloseModalAddTask')?.addEventListener('click', () => {
  closeModal(modalAddTask);
});

/* Custom Select Dropdown Logic */
const customSelectWrapper = $('#customSubjectSelect');
const customSubjectTrigger = $('#customSubjectSelect .custom-select-trigger');
const customSubjectSearch = $('#customSubjectSearch');

if (customSubjectTrigger) {
  customSubjectTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = customSelectWrapper.classList.contains('open');
    if (isOpen) {
      customSelectWrapper.classList.remove('open');
    } else {
      customSelectWrapper.classList.add('open');
      if (customSubjectSearch) customSubjectSearch.focus();
    }
  });
}

if (customSubjectSearch) {
  customSubjectSearch.addEventListener('click', (e) => e.stopPropagation());
  customSubjectSearch.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const options = document.querySelectorAll('#customSubjectOptions .custom-select-option');
    options.forEach(opt => {
      const text = opt.querySelector('.option-label').textContent.toLowerCase();
      opt.style.display = text.includes(term) ? 'flex' : 'none';
    });
  });
}

document.addEventListener('click', (e) => {
  if (customSelectWrapper && !customSelectWrapper.contains(e.target)) {
    customSelectWrapper.classList.remove('open');
  }
  if (taskSortWrapper && !taskSortWrapper.contains(e.target)) {
    taskSortWrapper.classList.remove('open');
  }
});

/* Task Sort Dropdown Logic */
const taskSortWrapper = $('#sortDropdown');
const taskSortTrigger = taskSortWrapper?.querySelector('.custom-select-trigger');

if (taskSortTrigger) {
  taskSortTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    taskSortWrapper.classList.toggle('open');
  });
  
  taskSortWrapper.querySelectorAll('.custom-select-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      state.taskSort = opt.dataset.sort;
      
      taskSortWrapper.classList.remove('open');
      renderTasks();
      updateSortUI();
    });
  });
}

const taskFilterWrapper = $('#filterDropdown');
const taskFilterTrigger = taskFilterWrapper?.querySelector('.custom-select-trigger');

if (taskFilterTrigger) {
  taskFilterTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    taskFilterWrapper.classList.toggle('open');
  });
  
  taskFilterWrapper.querySelectorAll('.custom-select-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      state.taskFilter = opt.dataset.filter;
      
      // Update checkmark visual
      taskFilterWrapper.querySelectorAll('.custom-select-option').forEach(o => {
        o.style.background = o === opt ? 'var(--bg-elevated)' : 'transparent';
      });
      
      taskFilterWrapper.classList.remove('open');
      renderTasks();
    });
  });
}

function updateSortUI() {
  const titleSortCol = $('#colSortTitle');
  if (!titleSortCol) return;
  const indicator = titleSortCol.querySelector('.sort-indicator');
  const icon = indicator.querySelector('.material-symbols-outlined');
  
  if (state.taskSort === 'title_asc') {
    indicator.classList.add('active');
    icon.textContent = 'arrow_downward';
  } else if (state.taskSort === 'title_desc') {
    indicator.classList.add('active');
    icon.textContent = 'arrow_upward';
  } else {
    indicator.classList.remove('active');
  }
}

$('#colSortTitle')?.addEventListener('click', () => {
  if (state.taskSort === 'title_asc') {
    state.taskSort = 'title_desc';
  } else if (state.taskSort === 'title_desc') {
    state.taskSort = '';
  } else {
    state.taskSort = 'title_asc';
  }
  renderTasks();
  updateSortUI();
});

// Run once on init
updateSortUI();

  $('#formAddTask')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('#taskId').value;
  const title = $('#taskTitle').value;
  const category = 'Sekolah'; // Default hardcoded since radio buttons are removed
  const deadline = $('#taskDeadline').value;
  const subject = $('#taskSubject').value;
  const description = $('#taskDescription')?.value || '';
  const referenceUrl = $('#taskReferenceUrl')?.value || '';
  const attachmentFile = $('#taskAttachment')?.files[0];
  
  const formData = new FormData();
  formData.append('title', title);
  formData.append('category', category);
  if (deadline) formData.append('deadline', deadline);
  if (subject) formData.append('subject', subject);
  formData.append('description', description);
  if (referenceUrl) formData.append('referenceUrl', referenceUrl);
  if (attachmentFile) formData.append('attachment', attachmentFile);
  
  try {
    if (id) {
      // Update existing task
      const updatedTask = await api(`/api/tasks/${id}`, {
        method: 'PUT',
        body: formData
      });
      const idx = state.tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        state.tasks[idx] = updatedTask;
      }
      toast('Tugas diperbarui');
    } else {
      // Create new task
      const newTask = await api('/api/tasks', {
        method: 'POST',
        body: formData
      });
      state.tasks.push(newTask);
      toast('Tugas ditambahkan');
    }
    
    renderTasks();
    if (window.renderDailyTasks) window.renderDailyTasks();
    closeModal(modalAddTask);
  } catch (err) { toast(err.message, true); }
});
