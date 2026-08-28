const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const defaultTheme = systemPrefersDark ? 'dark' : 'light';

const state = {
  entries: [],
  tasks: [],
  subjects: [],
  profile: {},
  editingId: null,
  newPhotoFiles: [],
  removedExistingPhotos: [],
  currentPreviewDownload: null,
  currentTheme: localStorage.getItem('pkl_theme') || 'system',
  searchQuery: '',
  taskSort: 'date_asc',
  taskFilter: 'all',
  selectedEntries: new Set(),
  currentView: 'active',
  entriesViewMode: localStorage.getItem('pkl_entries_view') || 'list'
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/** Close a modal-overlay with zoom-out animation */
function closeModal(overlay) {
  if (!overlay || !overlay.classList.contains('open')) return;
  overlay.classList.remove('open');
  overlay.classList.add('closing');
  overlay.addEventListener('animationend', () => {
    overlay.classList.remove('closing');
  }, { once: true });
  // Fallback in case animationend doesn't fire
  setTimeout(() => overlay.classList.remove('closing'), 250);
}
