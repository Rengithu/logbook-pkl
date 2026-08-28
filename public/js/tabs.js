/* ---------------- Tabs ---------------- */
$$('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.nav-item').forEach((b) => b.classList.remove('active'));
    $$('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    
    const tabName = btn.dataset.tab;
    $(`#tab-${tabName}`).classList.add('active');
    
    // Move the active indicator pill
    if (typeof updateNavIndicator === 'function') {
      updateNavIndicator();
    }
    
    // Update active tab state for context-aware search
    state.activeTab = tabName;
    
    // Update search placeholder based on active tab
    const searchInput = $('#globalSearchInput');
    if (searchInput) {
      if (tabName === 'tasks') searchInput.placeholder = window.t ? window.t('search.tasks') : 'Telusuri Tugas...';
      else if (tabName === 'settings') searchInput.placeholder = window.t ? window.t('search.subjects') : 'Telusuri Mapel...';
      else if (tabName === 'trash') searchInput.placeholder = window.t ? window.t('search.trash') : 'Telusuri Sampah...';
      else searchInput.placeholder = window.t ? window.t('search.default') : 'Telusuri di LogBook';
      
      // Trigger search if query exists to filter the new view
      if (state.searchQuery) {
        searchInput.dispatchEvent(new Event('input'));
      }
    }
    
    const newView = btn.dataset.view || 'active';
    if (state.currentView !== newView) {
      state.currentView = newView;
      state.selectedEntries.clear(); // clear selection on view change
      loadEntries();
    }
    
    if (tabName === 'tasks') loadTasks();
    if (tabName === 'dashboard') renderDashboard();
    if (tabName === 'calendar' && window.renderCalendar) {
      // Set to current date if needed, or just render current view
      window.renderCalendar();
    }
  });
});

function renderDashboard() {
  const tasks = state.tasks || [];
  const entries = state.entries || [];
  
  // Stats
  const todo = tasks.filter(t => t.status === 'todo').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  
  const now = new Date();
  const overdue = tasks.filter(t => {
    if (t.status === 'done' || !t.deadline) return false;
    return new Date(t.deadline) < now;
  }).length;
  
  if ($('#statTotalTasks')) $('#statTotalTasks').textContent = tasks.length;
  if ($('#statTodo')) $('#statTodo').textContent = todo;
  if ($('#statInProgress')) $('#statInProgress').textContent = inProgress;
  if ($('#statDone')) $('#statDone').textContent = done;
  if ($('#statOverdue')) $('#statOverdue').textContent = overdue;
  
  // Upcoming tasks & Tabs
  const upcomingList = $('#upcomingTasksList');
  const subjectTabsContainer = $('#dashboardSubjectTabs');
  
  if (upcomingList && subjectTabsContainer) {
    const upcomingAll = tasks.filter(t => t.status !== 'done' && t.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    // Extract unique subjects
    const subjectsSet = new Set();
    upcomingAll.forEach(t => {
      if (t.subject) subjectsSet.add(t.subject);
    });
    const allLabel = window.t ? window.t('dashboard.all') : 'Semua';
    const subjects = [allLabel, ...Array.from(subjectsSet)];
    
    // Initialize filter if not set or invalid
    if (!state.dashSubjectFilter || !subjects.includes(state.dashSubjectFilter)) {
      state.dashSubjectFilter = allLabel;
    }
    
    // Render tabs
    subjectTabsContainer.innerHTML = '';
    subjects.forEach(subj => {
      const btn = document.createElement('button');
      btn.className = `btn btn-sm ${state.dashSubjectFilter === subj ? 'btn-tonal' : 'btn-outline'}`;
      btn.style.borderRadius = '100px';
      btn.style.whiteSpace = 'nowrap';
      btn.textContent = subj;
      btn.addEventListener('click', () => {
        state.dashSubjectFilter = subj;
        renderDashboard(); // re-render to update tasks and active tab
      });
      subjectTabsContainer.appendChild(btn);
    });
    
    // Filter tasks
    const allLabelForFilter = window.t ? window.t('dashboard.all') : 'Semua';
    const upcomingFiltered = state.dashSubjectFilter === allLabelForFilter 
      ? upcomingAll 
      : upcomingAll.filter(t => t.subject === state.dashSubjectFilter);
      
    upcomingList.innerHTML = '';
    if (upcomingFiltered.length === 0) {
      upcomingList.innerHTML = `<p class="hint" style="grid-column: 1 / -1;">${window.t ? window.t('dashboard.emptyUpcoming') : 'Tidak ada tugas mendatang untuk'} ${escapeHtml(state.dashSubjectFilter)}.</p>`;
    } else {
      upcomingFiltered.forEach(t => {
        const isOverdue = new Date(t.deadline) < now;
        const taskCard = document.createElement('div');
        taskCard.className = 'dash-list-card';
        taskCard.innerHTML = `
            <div class="dash-list-card-title" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</div>
            <div class="dash-list-card-meta" style="color: ${isOverdue ? 'var(--danger)' : 'var(--fg-secondary)'};">Deadline: ${formatTanggalIndo(t.deadline)}</div>
        `;
        taskCard.addEventListener('click', () => {
          $('#modalAddTask .modal-title').textContent = 'Edit Tugas';
          $('#taskId').value = t.id;
          $('#taskTitle').value = t.title;
          $('#taskDeadline').value = t.deadline || '';
          $('#taskDescription').value = t.description || '';
          $('#taskReferenceUrl').value = t.referenceUrl || '';
          if (t.subject) {
            $('#taskSubject').value = t.subject;
            $('.custom-select-placeholder').textContent = t.subject;
            $('.custom-select-placeholder').style.color = 'var(--fg-primary)';
          } else {
            $('#taskSubject').value = '';
            $('.custom-select-placeholder').textContent = '-- Pilih Mapel --';
            $('.custom-select-placeholder').style.color = 'var(--fg-muted)';
          }
          $('#modalAddTask').classList.add('open');
        });
        upcomingList.appendChild(taskCard);
      });
    }
  }
}

function updateNavIndicator() {
  const indicator = document.querySelector('.nav-active-indicator');
  const activeItem = document.querySelector('.nav-item.active');
  const navContainer = document.querySelector('.sidebar-nav');
  
  if (indicator && activeItem && navContainer) {
    const navRect = navContainer.getBoundingClientRect();
    const activeRect = activeItem.getBoundingClientRect();
    
    // Offset from top of nav container to top of active item
    const offsetTop = activeRect.top - navRect.top;
    
    indicator.style.opacity = '1';
    indicator.style.height = `${activeRect.height}px`;
    indicator.style.transform = `translateY(${offsetTop}px)`;
  }
}

// Call on window load and resize to ensure correct position
window.addEventListener('load', () => {
  setTimeout(updateNavIndicator, 50); // slight delay to ensure DOM is fully rendered
});
window.addEventListener('resize', updateNavIndicator);
