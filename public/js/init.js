/* ---------------- Init ---------------- */
async function init() {
  applyTheme(state.currentTheme);
  datePicker.init();
  await loadProfile();
  await loadEntries();
  checkProfileFilled();
  
  // Global: close any modal-overlay when clicking backdrop
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('open')) {
      closeModal(e.target);
    }
  });
  
  // Search bar logic
  const searchInput = $('#globalSearchInput');
  const searchClear = $('#globalSearchClear');
  if (searchInput && searchClear) {
    const handleSearch = () => {
      const tab = state.activeTab || 'dashboard';
      if (tab === 'tasks') renderTasks();
      else if (tab === 'settings') renderSubjectList();
      else renderEntries();
    };

    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      searchClear.style.display = state.searchQuery ? 'inline-flex' : 'none';
      handleSearch();
    });
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      state.searchQuery = '';
      searchClear.style.display = 'none';
      searchInput.focus();
      handleSearch();
    });
  }
  
  // Right Sidebar Toggle Logic (Google Drive style)
  const rightSidebarToggle = $('#rightSidebarToggle');
  if (rightSidebarToggle) {
    // Check initial state from localStorage
    const isSidebarClosed = localStorage.getItem('pkl_right_sidebar_closed') === 'true';
    if (isSidebarClosed) {
      document.body.classList.add('right-sidebar-closed');
      const icon = rightSidebarToggle.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = 'chevron_left';
    }

    rightSidebarToggle.addEventListener('click', () => {
      const isClosedNow = document.body.classList.toggle('right-sidebar-closed');
      localStorage.setItem('pkl_right_sidebar_closed', isClosedNow);
      
      const icon = rightSidebarToggle.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.textContent = isClosedNow ? 'chevron_left' : 'chevron_right';
      }
      
      // If closing the right sidebar, also close the side panel if open
      if (isClosedNow) {
        const sidePanel = $('#sidePanel');
        if (sidePanel && sidePanel.classList.contains('open')) {
          sidePanel.classList.remove('open');
        }
      }
    });
  }
}
