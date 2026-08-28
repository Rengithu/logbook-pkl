const translations = {
  id: {
    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.entries': 'Catatan',
    'nav.calendar': 'Kalender',
    'nav.tasks': 'Tugas',
    'nav.settings': 'Pengaturan',
    'nav.trash': 'Sampah',
    'trash.title': 'Tempat Sampah',
    'trash.subtitle': 'Lihat dan pulihkan catatan yang telah dihapus.',
    // Settings
    'settings.title': 'Pengaturan Aplikasi',
    'settings.language.title': 'Bahasa',
    'settings.language.hint': 'Pilih bahasa antarmuka aplikasi.',
    'settings.theme.title': 'Tampilan (Tema)',
    'settings.theme.hint': 'Pilih mode terang atau gelap, atau gunakan preferensi sistem sebagai default.',
    'settings.theme.dark': 'Gelap',
    'settings.theme.light': 'Terang',
    'settings.theme.system': 'Sistem Default',
    'settings.api.title': 'API Key Gemini',
    'settings.api.hint': 'Kunci akses untuk mengaktifkan fitur asisten AI (merapikan kalimat dan koreksi ejaan). Opsional.',
    'settings.api.save': 'Simpan',
    'settings.api.show': 'Lihat',
    'settings.api.hide': 'Tutup',
    // Search
    'search.default': 'Telusuri di LogBook',
    'search.tasks': 'Telusuri Tugas...',
    'search.subjects': 'Telusuri Mapel...',
    'search.trash': 'Telusuri Sampah...',
    // Sidebar
    'sidebar.calendar': 'Kalender',
    'sidebar.agenda': 'Agenda Harian:',
    'sidebar.empty': 'Tidak ada tugas tertunda atau yang harus diselesaikan hari ini.',
    'sidebar.empty': 'Tidak ada tugas tertunda atau yang harus diselesaikan hari ini.',
    'sidebar.summary': 'Ringkasan',
    'sidebar.totalEntries': 'Total Catatan',
    'sidebar.pendingTasks': 'Tugas Tertunda',
    'sidebar.openTasks': 'Buka Tugas',
    // Dashboard
    'dashboard.title': 'Beranda',
    'dashboard.subtitle': 'Ringkasan aktivitas PKL dan tugas-tugasmu.',
    'dashboard.totalTasks': 'Total Tugas',
    'dashboard.todo': 'Belum Mulai',
    'dashboard.inProgress': 'Proses',
    'dashboard.done': 'Selesai',
    'dashboard.overdue': 'Overdue',
    'dashboard.upcoming': 'Tugas Mendatang',
    'dashboard.all': 'Semua',
    'dashboard.emptyUpcoming': 'Tidak ada tugas mendatang untuk',
    // Entries
    'entries.title': 'Daftar Catatan',
    'entries.subtitle': 'Catat dan kelola aktivitas harianmu selama PKL di sini.',
    'entries.week': 'Minggu',
    'entries.count': 'entri',
    'entries.dailyCount': 'catatan harian',
    'entries.preview': 'Pratinjau',
    // Tasks
    'tasks.title': 'Papan Manajemen Tugas',
    'tasks.subtitle': 'Catat dan pantau seluruh tugas dari sekolahmu di sini.',
    'tasks.col.title': 'Judul Tugas',
    'tasks.col.subject': 'Mata Pelajaran',
    'tasks.col.deadline': 'Deadline',
    'tasks.col.status': 'Status',
    'tasks.status.todo': 'BELUM MULAI',
    'tasks.status.inProgress': 'PROSES',
    'tasks.status.done': 'SELESAI',
    // Calendar Tab
    'calendar.title': 'Kalender PKL',
    'calendar.subtitle': 'Tinjauan seluruh jadwal kegiatan dan tugasmu.',
    'calendar.today': 'Hari Ini',
    // Sidebar Additional
    'sidebar.todayTasks': 'Tugas Hari Ini',
    // Profile
    'profile.title': 'Identitas Peserta PKL',
    'profile.subtitle': 'Otomatis muncul di laporan',
    'profile.name': 'Nama Peserta Didik',
    'profile.place': 'Dunia Kerja / Tempat PKL',
    'profile.instructor': 'Nama Instruktur',
    'profile.mentor': 'Nama Pembimbing',
    // Modal Entry
    'modal.entry.titleAdd': 'Tambah Catatan',
    'modal.entry.titleEdit': 'Edit Catatan',
    'modal.entry.date': 'Tanggal Kegiatan',
    'modal.entry.desc': 'Nama Pekerjaan & Pelaksanaan Kegiatan / Hasil',
    'modal.entry.photo': 'Foto Dokumentasi',
    'modal.entry.photoOpt': '(opsional, bisa lebih dari satu)',
    'modal.entry.dropzone1': 'Tarik & lepas foto di sini, atau ',
    'modal.entry.dropzone2': 'Jelajahi File',
    'modal.entry.dropzone3': 'Mendukung format JPG, PNG, WebP (bisa pilih banyak foto)',
    'modal.entry.save': 'Simpan Catatan',
    // Modal Task
    'modal.task.titleAdd': 'Tambah Tugas',
    'modal.task.titleEdit': 'Edit Tugas',
    'modal.task.sub': 'Tugas tidak akan masuk ke Laporan PKL',
    'modal.task.name': 'Judul Tugas',
    'modal.task.subject': 'Mata Pelajaran (Opsional)',
    'modal.task.deadline': 'Tenggat Waktu (Opsional)',
    'modal.task.desc': 'Deskripsi / Catatan (Opsional)',
    'modal.task.url': 'Tautan URL (Opsional)',
    'modal.task.attach': 'Lampiran (Opsional)',
    'modal.task.save': 'Simpan Tugas',
    // Subject Modal
    'modal.subject.title': 'Atur Mata Pelajaran',
    // Common
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'common.add': 'Tambah',
    'common.edit': 'Edit',
    'common.delete': 'Hapus',
    'common.close': 'Tutup',
    'common.restore': 'Pulihkan'
  },
  en: {
    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.entries': 'Journal',
    'nav.calendar': 'Calendar',
    'nav.tasks': 'Tasks',
    'nav.settings': 'Settings',
    'nav.trash': 'Trash',
    'trash.title': 'Trash',
    'trash.subtitle': 'View and restore deleted entries.',
    // Settings
    'settings.title': 'App Settings',
    'settings.language.title': 'Language',
    'settings.language.hint': 'Choose the application interface language.',
    'settings.theme.title': 'Appearance (Theme)',
    'settings.theme.hint': 'Choose light or dark mode, or use system preference as default.',
    'settings.theme.dark': 'Dark',
    'settings.theme.light': 'Light',
    'settings.theme.system': 'System Default',
    'settings.api.title': 'Gemini API Key',
    'settings.api.hint': 'Access key to enable AI assistant features (sentence tidying and spell check). Optional.',
    'settings.api.save': 'Save',
    'settings.api.show': 'Show',
    'settings.api.hide': 'Hide',
    // Search
    'search.default': 'Search in LogBook',
    'search.tasks': 'Search Tasks...',
    'search.subjects': 'Search Subjects...',
    'search.trash': 'Search Trash...',
    // Sidebar
    'sidebar.calendar': 'Calendar',
    'sidebar.agenda': 'Daily Agenda:',
    'sidebar.empty': 'No pending tasks or tasks due today.',
    'sidebar.summary': 'Summary',
    'sidebar.totalEntries': 'Total Entries',
    'sidebar.pendingTasks': 'Pending Tasks',
    'sidebar.openTasks': 'Open Tasks',
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Summary of your internship activities and tasks.',
    'dashboard.totalTasks': 'Total Tasks',
    'dashboard.todo': 'To Do',
    'dashboard.inProgress': 'In Progress',
    'dashboard.done': 'Done',
    'dashboard.overdue': 'Overdue',
    'dashboard.upcoming': 'Upcoming Tasks',
    'dashboard.all': 'All',
    'dashboard.emptyUpcoming': 'No upcoming tasks for',
    // Entries
    'entries.title': 'Entries List',
    'entries.subtitle': 'Log and manage your daily internship activities here.',
    'entries.week': 'Week',
    'entries.count': 'entries',
    'entries.dailyCount': 'daily logs',
    'entries.preview': 'Preview',
    // Tasks
    'tasks.title': 'Task Management Board',
    'tasks.subtitle': 'Log and monitor all your school tasks here.',
    'tasks.col.title': 'Task Title',
    'tasks.col.subject': 'Subject',
    'tasks.col.deadline': 'Deadline',
    'tasks.col.status': 'Status',
    'tasks.status.todo': 'TO DO',
    'tasks.status.inProgress': 'IN PROGRESS',
    'tasks.status.done': 'DONE',
    'tasks.empty': 'No tasks found.',
    // Calendar Tab
    'calendar.title': 'Internship Calendar',
    'calendar.subtitle': 'Overview of all your schedules and tasks.',
    'calendar.today': 'Today',
    // Sidebar Additional
    'sidebar.todayTasks': 'Today\'s Tasks',
    // Profile
    'profile.title': 'Internship Participant Identity',
    'profile.subtitle': 'Automatically appears in reports',
    'profile.name': 'Student Name',
    'profile.place': 'Company / Internship Place',
    'profile.instructor': 'Instructor Name',
    'profile.mentor': 'Mentor Name',
    // Modal Entry
    'modal.entry.titleAdd': 'Add Entry',
    'modal.entry.titleEdit': 'Edit Entry',
    'modal.entry.date': 'Activity Date',
    'modal.entry.desc': 'Job Name & Activity Execution / Result',
    'modal.entry.photo': 'Documentation Photos',
    'modal.entry.photoOpt': '(optional, can be more than one)',
    'modal.entry.dropzone1': 'Drag & drop photos here, or ',
    'modal.entry.dropzone2': 'Browse Files',
    'modal.entry.dropzone3': 'Supports JPG, PNG, WebP formats (can select multiple photos)',
    'modal.entry.save': 'Save Entry',
    // Modal Task
    'modal.task.titleAdd': 'Add Task',
    'modal.task.titleEdit': 'Edit Task',
    'modal.task.sub': 'Tasks will not be included in the Internship Report',
    'modal.task.name': 'Task Title',
    'modal.task.subject': 'Subject (Optional)',
    'modal.task.deadline': 'Deadline (Optional)',
    'modal.task.desc': 'Description / Notes (Optional)',
    'modal.task.url': 'URL Link (Optional)',
    'modal.task.attach': 'Attachment (Optional)',
    'modal.task.save': 'Save Task',
    // Subject Modal
    'modal.subject.title': 'Manage Subjects',
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.add': 'Add',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.close': 'Close',
    'common.restore': 'Restore'
  }
};

let currentLang = localStorage.getItem('pkl_lang') || 'id';

function t(key) {
  const dict = translations[currentLang] || translations['id'];
  return dict[key] || key;
}

function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('pkl_lang', lang);
  applyLanguage();
}

function applyLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  
  const btnId = document.getElementById('btnLangId');
  const btnEn = document.getElementById('btnLangEn');
  if (btnId && btnEn) {
    if (currentLang === 'id') {
      btnId.classList.add('btn-tonal');
      btnId.classList.remove('btn-outline');
      btnEn.classList.add('btn-outline');
      btnEn.classList.remove('btn-tonal');
    } else {
      btnEn.classList.add('btn-tonal');
      btnEn.classList.remove('btn-outline');
      btnId.classList.add('btn-outline');
      btnId.classList.remove('btn-tonal');
    }
  }
  
  // Re-trigger dynamic text logic where possible
  if (window.renderDashboard) window.renderDashboard();
  if (window.loadEntries) window.loadEntries();
  if (window.renderTasks) window.renderTasks();
  if (window.renderDailyTasks) window.renderDailyTasks();
  
  // Update static placeholders
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    const tabName = window.state?.activeTab || 'dashboard';
    if (tabName === 'tasks') searchInput.placeholder = t('search.tasks');
    else if (tabName === 'settings') searchInput.placeholder = t('search.subjects');
    else if (tabName === 'trash') searchInput.placeholder = t('search.trash');
    else searchInput.placeholder = t('search.default');
  }
  
  // Dispatch custom event to notify other scripts
  window.dispatchEvent(new Event('languageChanged'));
}

// Export for other modules if needed
window.t = t;
window.setLanguage = setLanguage;

// Initial application
window.addEventListener('DOMContentLoaded', () => {
  applyLanguage();
});
