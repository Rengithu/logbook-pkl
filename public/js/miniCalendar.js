  /* ---------------- Mini Calendar (Side Panel) & Full Calendar ---------------- */
  let currentMcDate = new Date();
  let currentCalDate = new Date();
  
  function renderMiniCalendar() {
    const year = currentMcDate.getFullYear();
    const month = currentMcDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Adjust firstDay for Monday start (0=Mon, 6=Sun)
    let startDay = firstDay === 0 ? 6 : firstDay - 1; 
    
    const activeLang = localStorage.getItem('pkl_lang') || 'id';
    const monthNames = [...Array(12).keys()].map(m => new Intl.DateTimeFormat(activeLang, { month: 'long' }).format(new Date(2000, m, 1)));
    $('#mcMonthYear').textContent = `${monthNames[month]} ${year}`;
    
    // Render translated weekdays (Mon-Sun)
    const weekdaysContainer = document.querySelector('.mc-weekdays');
    if (weekdaysContainer) {
      weekdaysContainer.innerHTML = '';
      for (let i = 1; i <= 7; i++) {
        // Use a known Monday (e.g. 2000-01-03) and increment
        const dayInitial = new Intl.DateTimeFormat(activeLang, { weekday: 'narrow' }).format(new Date(2000, 0, 2 + i));
        weekdaysContainer.innerHTML += `<span>${dayInitial}</span>`;
      }
    }
    
    const mcDays = $('#mcDays');
    mcDays.innerHTML = '';
    
    // Empty slots
    for (let i = 0; i < startDay; i++) {
      const el = document.createElement('span');
      el.className = 'empty';
      mcDays.appendChild(el);
    }
    
    // Days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const el = document.createElement('span');
      el.textContent = i;
      
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
        el.classList.add('today');
      }
      // check holiday
      const hol = typeof getHoliday === 'function' ? getHoliday(dateStr) : null;
      if (hol) {
        el.classList.add('holiday');
        el.title = `${hol.name} (${hol.type === 'bali' ? 'Bali' : 'Nasional'})`;
      }
      mcDays.appendChild(el);
    }
  }

  $('#btnMcPrev')?.addEventListener('click', () => { currentMcDate.setMonth(currentMcDate.getMonth() - 1); renderMiniCalendar(); });
  $('#btnMcNext')?.addEventListener('click', () => { currentMcDate.setMonth(currentMcDate.getMonth() + 1); renderMiniCalendar(); });


  $('#mcPrev')?.addEventListener('click', () => {
    currentMcDate.setMonth(currentMcDate.getMonth() - 1);
    renderMiniCalendar();
  });
  
  $('#mcNext')?.addEventListener('click', () => {
    currentMcDate.setMonth(currentMcDate.getMonth() + 1);
    renderMiniCalendar();
  });

  const sideViews = {
    calendar: { id: 'sideViewCalendar', btn: $('#btnCalendarSide'), title: 'Kalender', icon: 'calendar_month' },
    keep: { id: 'sideViewKeep', btn: $('#btnKeepSide'), title: 'Catatan Cepat', icon: 'lightbulb' },
    tasks: { id: 'sideViewTasks', btn: $('#btnTasksSide'), title: 'Tugas Hari Ini', icon: 'task_alt' },
    contacts: { id: 'sideViewContacts', btn: $('#btnContactsSide'), title: 'Kontak Penting', icon: 'person' }
  };

  let activeSideView = null;

  function openSidePanel(viewKey) {
    const viewInfo = sideViews[viewKey];
    if (!viewInfo) return;
    
    // Hide all views and deactivate all buttons
    Object.values(sideViews).forEach(v => {
      $('#' + v.id).style.display = 'none';
      v.btn?.classList.remove('active');
    });
    
    // Show selected view
    $('#' + viewInfo.id).style.display = 'block';
    
    // Set dynamic active color based on icon
    if (viewInfo.btn) {
      viewInfo.btn.classList.add('active');
      const iconSpan = viewInfo.btn.querySelector('.material-symbols-outlined');
      if (iconSpan && iconSpan.style.color) {
        viewInfo.btn.style.setProperty('--active-icon-color', iconSpan.style.color);
      }
    }
    
    // Update header
    $('#sidePanelTitle').textContent = viewInfo.title;
    $('#sidePanelIcon').textContent = viewInfo.icon;
    if (viewInfo.btn) {
      const iconSpan = viewInfo.btn.querySelector('.material-symbols-outlined');
      if (iconSpan && iconSpan.style.color) {
        $('#sidePanelIcon').style.color = iconSpan.style.color;
      }
    }
    
    updateRightNavIndicator();
    
    // Open panel
    $('#sidePanel').classList.add('open');
    activeSideView = viewKey;
    
    // Trigger specific render functions
    if (viewKey === 'calendar') {
      renderMiniCalendar();
      // Select today's agenda if it exists
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const holiday = typeof getHoliday === 'function' ? getHoliday(dateStr) : null;
      const isSunday = today.getDay() === 0;

    
    let agendaHtml = '';
    if (holiday) {
      agendaHtml += `<div style="color:var(--danger); margin-bottom: 8px;"><strong>Libur:</strong> ${holiday.name}</div>`;
    } else if (isSunday) {
      agendaHtml += `<div style="color:var(--danger); margin-bottom: 8px;"><strong>Hari Minggu (Akhir Pekan)</strong></div>`;
    }
    
    const entry = state.entries.find(e => e.tanggal === dateStr);
    if (entry) {
      agendaHtml += `<strong>${entry.kegiatan}</strong><br><span style="color:var(--fg-muted)">${entry.keterangan || '-'}</span>`;
    } else if (!holiday && !isSunday) {
      agendaHtml = 'Belum ada jadwal.';
    }
    $('#mcAgenda').innerHTML = agendaHtml;
    } else if (viewKey === 'tasks') {
      renderDailyTasks();
    } else if (viewKey === 'contacts') {
      renderContacts();
    }
  }

  // Bind click events to sidebar buttons
  Object.keys(sideViews).forEach(key => {
    sideViews[key].btn?.addEventListener('click', (e) => {
      if (activeSideView === key && $('#sidePanel').classList.contains('open')) {
        $('#sidePanel').classList.remove('open');
        sideViews[key].btn.classList.remove('active');
        activeSideView = null;
        updateRightNavIndicator();
      } else {
        openSidePanel(key);
      }
    });
  });

  function updateRightNavIndicator() {
    const indicator = document.querySelector('.right-nav-active-indicator');
    const activeBtn = document.querySelector('.right-sidebar-icon.active');
    const container = document.querySelector('.app-right-sidebar');
    
    if (indicator && container) {
      if (activeBtn) {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeBtn.getBoundingClientRect();
        const offsetTop = activeRect.top - containerRect.top;
        const indicatorHeight = 24;
        const finalY = offsetTop + (activeRect.height / 2) - (indicatorHeight / 2);
        
        indicator.style.opacity = '1';
        indicator.style.transform = `translateY(${finalY}px)`;
        
        // Dynamically match the indicator color to the active icon's color
        const iconSpan = activeBtn.querySelector('.material-symbols-outlined');
        if (iconSpan && iconSpan.style.color) {
          indicator.style.backgroundColor = iconSpan.style.color;
        } else {
          indicator.style.backgroundColor = 'var(--primary)';
        }
      } else {
        indicator.style.opacity = '0';
      }
    }
  }

  window.addEventListener('resize', updateRightNavIndicator);

  // Keep Notes auto-save logic
  const quickNotesArea = $('#quickNotesArea');
  if (quickNotesArea) {
    quickNotesArea.value = localStorage.getItem('quickNotes') || '';
    quickNotesArea.addEventListener('input', () => {
      localStorage.setItem('quickNotes', quickNotesArea.value);
    });
  }

  function renderDailyTasks() {
    const list = $('#dailyTasksList');
    if (!list) return;
    const todayStr = new Date().toISOString().split('T')[0];
    let hasOverdue = false;
    const daily = (state.tasks || []).filter(t => {
      if (t.status === 'done') return false; // Ignore completed tasks even if deadline is today
      if (t.deadline === todayStr) return true; // Due today
      // Check if overdue
      if (t.deadline && t.deadline < todayStr) {
        hasOverdue = true;
        return true; 
      }
      return false;
    });
    
    const overdueBadge = document.getElementById('overdueBadge');
    if (overdueBadge) {
      overdueBadge.style.display = hasOverdue ? 'block' : 'none';
    }
    
    list.innerHTML = '';
    if (daily.length === 0) {
      list.innerHTML = '<div style="font-size: 13px; color: var(--fg-secondary);">Tidak ada tugas tertunda atau yang harus diselesaikan hari ini.</div>';
      return;
    }
    
    daily.forEach(t => {
      const isDone = t.status === 'done';
      const card = document.createElement('div');
      card.className = 'dash-list-card';
      card.style.display = 'flex';
      card.style.alignItems = 'center';
      card.style.gap = '8px';
      card.style.padding = '10px 12px';
      
      card.innerHTML = `
        <span class="material-symbols-outlined" style="font-size: 20px; color: ${isDone ? 'var(--success)' : 'var(--fg-secondary)'}; cursor: pointer;">
          ${isDone ? 'check_circle' : 'radio_button_unchecked'}
        </span>
        <div style="flex: 1; font-size: 13px; ${isDone ? 'text-decoration: line-through; color: var(--fg-muted);' : ''}">${escapeHtml(t.title)}</div>
      `;
      list.appendChild(card);
    });
  }
  window.renderDailyTasks = renderDailyTasks;

  $('#btnRefreshDailyTasks')?.addEventListener('click', () => {
    renderDailyTasks();
  });

  function renderContacts() {
    const list = $('#contactsList');
    if (!list) return;
    // For now we use dummy contacts since we don't have the backend fully up yet
    const contacts = [
      { name: 'Bpk. Budi Santoso', role: 'Pembimbing Industri', phone: '081234567890' },
      { name: 'Ibu Ratna', role: 'HRD', phone: '08987654321' }
    ];
    
    list.innerHTML = '';
    contacts.forEach(c => {
      const card = document.createElement('div');
      card.className = 'dash-list-card';
      card.style.padding = '12px';
      card.innerHTML = `
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">${escapeHtml(c.name)}</div>
        <div style="font-size: 12px; color: var(--primary); margin-bottom: 8px;">${escapeHtml(c.role)}</div>
        <div style="font-size: 12px; display: flex; align-items: center; gap: 4px; color: var(--fg-secondary);">
          <span class="material-symbols-outlined" style="font-size: 14px;">call</span> ${escapeHtml(c.phone)}
        </div>
      `;
      list.appendChild(card);
    });
  }

  // Full Calendar Logic
  window.renderCalendar = function() {
    const grid = $('#calendarGrid');
    if (!grid) return;
    
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let startDay = firstDay === 0 ? 6 : firstDay - 1; 
    
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    $('#calMonthYear').textContent = `${monthNames[month]} ${year}`;
    
    grid.innerHTML = '';
    
    // Empty cells
    for (let i = 0; i < startDay; i++) {
      const cell = document.createElement('div');
      cell.style.background = 'var(--bg-elevated)';
      grid.appendChild(cell);
    }
    
    const today = new Date();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const cell = document.createElement('div');
      cell.style.background = 'var(--bg-surface)';
      cell.style.padding = '8px';
      cell.style.display = 'flex';
      cell.style.flexDirection = 'column';
      cell.style.gap = '4px';
      cell.style.overflow = 'hidden';
      
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = (year === today.getFullYear() && month === today.getMonth() && i === today.getDate());
      
      // Entries this day
      const dayEntries = (state.entries || []).filter(e => e.tanggal === dateStr && !e.isDeleted);
      
      const dayOfWeek = new Date(year, month, i).getDay();
      const hol = typeof getHoliday === 'function' ? getHoliday(dateStr) : null;
      const isHoliday = (dayOfWeek === 0 || dayOfWeek === 6) || hol;
      
      let headerHtml = `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">`;
      if (isToday) {
        headerHtml += `<span style="background: var(--primary); color: #fff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px;" title="Hari Ini${dayEntries.length > 0 ? ` (${dayEntries.length} Jurnal)` : ''}">${i}</span>`;
      } else if (dayEntries.length > 0) {
        headerHtml += `<span style="background: var(--primary-badge); color: var(--primary); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px;" title="${dayEntries.length} Jurnal">${i}</span>`;
      } else {
        const textColor = isHoliday ? 'var(--danger)' : 'var(--fg-secondary)';
        headerHtml += `<span style="font-weight: 500; font-size: 14px; color: ${textColor}; padding-left: 4px; width: 24px; height: 24px; display: flex; align-items: center;">${i}</span>`;
      }
      
      // Holiday indicator
      if (hol) {
        headerHtml += `<span class="material-symbols-outlined" style="font-size: 14px; color: var(--danger);" title="${hol.name}">celebration</span>`;
      }
      headerHtml += `</div>`;
      
      cell.innerHTML = headerHtml;
      
      // Tasks deadline this day
      const dayTasks = (state.tasks || []).filter(t => t.deadline === dateStr);
      dayTasks.forEach(t => {
        let color = 'var(--warning)';
        if (t.status === 'done') color = 'var(--success)';
        else if (new Date(t.deadline) < today && t.status !== 'done') color = 'var(--danger)';
        
        cell.innerHTML += `<div style="font-size: 11px; padding: 2px 6px; background: rgba(255,255,255,0.05); color: ${color}; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-left: 2px solid ${color};" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</div>`;
      });
      
      grid.appendChild(cell);
    }
  }

  $('#btnCalPrev')?.addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth() - 1); window.renderCalendar(); });
  $('#btnCalNext')?.addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth() + 1); window.renderCalendar(); });
  $('#btnCalToday')?.addEventListener('click', () => { currentCalDate = new Date(); window.renderCalendar(); });

  $('#btnCloseSidePanel')?.addEventListener('click', () => {
    $('#sidePanel').classList.remove('open');
    if (activeSideView && sideViews[activeSideView]) {
      sideViews[activeSideView].btn.classList.remove('active');
    }
    activeSideView = null;
  });
