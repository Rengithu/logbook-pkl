/* ---------------- Theme Management ---------------- */
function applyTheme(themeSetting) {
  state.currentTheme = themeSetting;
  localStorage.setItem('pkl_theme', themeSetting);
  
  let actualTheme = themeSetting;
  if (themeSetting === 'system') {
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    actualTheme = systemPrefersDark ? 'dark' : 'light';
  }
  
  document.documentElement.setAttribute('data-theme', actualTheme);

  // Update active states on settings buttons
  const btnDark = $('#btnThemeDark');
  const btnLight = $('#btnThemeLight');
  const btnSystem = $('#btnThemeSystem');
  
  if (btnDark && btnLight && btnSystem) {
    btnDark.classList.toggle('active', themeSetting === 'dark');
    btnLight.classList.toggle('active', themeSetting === 'light');
    btnSystem.classList.toggle('active', themeSetting === 'system');
  }
}

$('#btnThemeDark')?.addEventListener('click', () => { applyTheme('dark'); toast('Tema diubah ke Gelap'); });
$('#btnThemeLight')?.addEventListener('click', () => { applyTheme('light'); toast('Tema diubah ke Terang'); });
$('#btnThemeSystem')?.addEventListener('click', () => { applyTheme('system'); toast('Tema mengikuti Sistem Default'); });

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (state.currentTheme === 'system') {
    applyTheme('system');
  }
});

let toastTimeout;
function toast(message, isError = false, action = null) {
  const el = $('#toast');
  const msgEl = $('#toastMsg');
  const actionBtn = $('#toastAction');
  
  if (toastTimeout) clearTimeout(toastTimeout);
  
  msgEl.textContent = message;
  el.classList.toggle('error', isError);
  
  if (action) {
    actionBtn.textContent = action.label;
    actionBtn.style.display = 'block';
    actionBtn.onclick = () => {
      el.classList.remove('show');
      if (toastTimeout) clearTimeout(toastTimeout);
      action.onClick();
    };
  } else {
    actionBtn.style.display = 'none';
  }
  
  el.classList.add('show');
  
  // Extend timeout if there's an action, to give user time to click Undo
  const duration = action ? 6000 : 3000;
  toastTimeout = setTimeout(() => el.classList.remove('show'), duration);
}

async function api(url, options = {}) {
  const res = await fetch(url, options);
  let data = null;
  try { data = await res.json(); } catch (e) { /* not json */ }
  if (!res.ok) {
    throw new Error((data && data.error) || 'Terjadi kesalahan');
  }
  return data;
}

function customConfirm(message) {
  return new Promise(resolve => {
    const modal = $('#customConfirmModal');
    const msgEl = $('#customConfirmText');
    const btnCancel = $('#btnCustomConfirmCancel');
    const btnOk = $('#btnCustomConfirmOk');
    
    msgEl.textContent = message;
    
    const cleanup = () => {
      closeModal(modal);
      btnCancel.removeEventListener('click', onCancel);
      btnOk.removeEventListener('click', onOk);
    };
    
    const onCancel = () => { cleanup(); resolve(false); };
    const onOk = () => { cleanup(); resolve(true); };
    
    btnCancel.addEventListener('click', onCancel);
    btnOk.addEventListener('click', onOk);
    
    modal.classList.add('open');
  });
}
function formatTanggalIndo(tanggal) {
  if (!tanggal) return '-';
  const cleanDate = typeof tanggal === 'string' && tanggal.includes('T') ? tanggal.split('T')[0] : String(tanggal);
  const parts = cleanDate.split('-');
  if (parts.length < 3) return cleanDate;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12) return cleanDate;
  const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${String(d).padStart(2,'0')} ${bulan[m-1]} ${y}`;
}

function weekRangeLabelClient(mondayKey, entries = []) {
  const bulanSingkat = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const [y, m, d] = mondayKey.split('-').map(Number);
  
  let numDays = 5;
  if (entries && entries.length > 0) {
    const hasSat = entries.some(e => new Date(e.tanggal).getDay() === 6);
    const hasSun = entries.some(e => new Date(e.tanggal).getDay() === 0);
    if (hasSun) numDays = 7;
    else if (hasSat) numDays = 6;
  }
  
  const days = [];
  for (let i = 0; i < numDays; i++) {
    days.push(new Date(y, m - 1, d + i));
  }

  let startIdx = 0;
  while (startIdx < days.length) {
    const dStr = `${days[startIdx].getFullYear()}-${String(days[startIdx].getMonth()+1).padStart(2, '0')}-${String(days[startIdx].getDate()).padStart(2, '0')}`;
    if (getHoliday(dStr)) startIdx++;
    else break;
  }
  if (startIdx === days.length) startIdx = 0;

  let endIdx = days.length - 1;
  while (endIdx >= startIdx) {
    const dStr = `${days[endIdx].getFullYear()}-${String(days[endIdx].getMonth()+1).padStart(2, '0')}-${String(days[endIdx].getDate()).padStart(2, '0')}`;
    if (getHoliday(dStr)) endIdx--;
    else break;
  }

  const startDate = days[startIdx];
  const endDate = days[endIdx];

  if (startDate.getMonth() === endDate.getMonth()) {
    if (startDate.getDate() === endDate.getDate()) {
       return `${startDate.getDate()} ${bulanSingkat[startDate.getMonth()]} ${startDate.getFullYear()}`;
    }
    return `${startDate.getDate()} - ${endDate.getDate()} ${bulanSingkat[startDate.getMonth()]} ${startDate.getFullYear()}`;
  }
  return `${startDate.getDate()} ${bulanSingkat[startDate.getMonth()]} - ${endDate.getDate()} ${bulanSingkat[endDate.getMonth()]} ${endDate.getFullYear()}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

