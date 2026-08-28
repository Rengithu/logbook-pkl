/* ---------------- Identitas tab ---------------- */
function getAvatarSVG(name) {
  const initials = name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%234285F4"/><text x="50" y="50" fill="white" font-size="40" font-family="sans-serif" text-anchor="middle" dominant-baseline="central" font-weight="bold">${initials}</text></svg>`;
}

function renderQuickProfile(profile) {
  const nameEl = $('#quickProfileName');
  const placeEl = $('#quickProfilePlace');
  const instEl = $('#quickProfileInstructor');
  const supEl = $('#quickProfileSupervisor');

  if (nameEl) nameEl.textContent = profile.namaPeserta || 'Belum diisi';
  if (placeEl) placeEl.textContent = profile.tempatPkl || 'Tempat PKL belum diisi';
  if (instEl) instEl.textContent = profile.namaInstruktur || '-';
  if (supEl) supEl.textContent = profile.namaPembimbing || '-';
}

const openProfileModal = async () => {
  await loadProfile();
  const popover = $('#profilePopover');
  const btn = $('#btnOpenProfileModal');
  
  if (popover.classList.contains('open')) {
    closeProfileModal();
  } else {
    popover.classList.add('open');
    if (btn) btn.classList.add('profile-active');
  }
};
const closeProfileModal = () => {
  $('#profilePopover').classList.remove('open');
  const btn = $('#btnOpenProfileModal');
  if (btn) btn.classList.remove('profile-active');
};

document.addEventListener('click', (e) => {
  const popover = $('#profilePopover');
  if (popover && popover.classList.contains('open')) {
    if (!popover.contains(e.target) && !$('#btnOpenProfileModal').contains(e.target) && !$('#btnQuickEditProfile')?.contains(e.target)) {
      closeProfileModal();
    }
  }
});

$('#btnQuickEditProfile')?.addEventListener('click', openProfileModal);
$('#btnOpenProfileModal')?.addEventListener('click', openProfileModal);
$('#btnCloseProfile')?.addEventListener('click', closeProfileModal);
$('#btnCancelProfile')?.addEventListener('click', closeProfileModal);

async function loadProfile() {
  try {
    const profile = await api('/api/profile');
    state.profile = profile || {};
    $('#namaPeserta').value = profile.namaPeserta || '';
    $('#tempatPkl').value = profile.tempatPkl || '';
    $('#namaInstruktur').value = profile.namaInstruktur || '';
    $('#namaPembimbing').value = profile.namaPembimbing || '';
    $('#geminiApiKey').value = profile.geminiApiKey || '';
    renderQuickProfile(state.profile);
  } catch (e) { toast(e.message, true); }
}

$('#btnToggleApiKey').addEventListener('click', () => {
  const input = $('#geminiApiKey');
  const icon = $('#apiKeyIcon');
  const text = $('#apiKeyBtnText');
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  icon.textContent = isHidden ? 'visibility_off' : 'visibility';
  text.textContent = isHidden ? 'Sembunyikan' : 'Lihat';
});

$('#profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const updated = {
      namaPeserta: $('#namaPeserta').value,
      tempatPkl: $('#tempatPkl').value,
      namaInstruktur: $('#namaInstruktur').value,
      namaPembimbing: $('#namaPembimbing').value
    };
    await api('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    Object.assign(state.profile, updated);
    renderQuickProfile(state.profile);
    toast('Identitas berhasil disimpan');
    closeProfileModal();
  } catch (e) { toast(e.message, true); }
});

$('#formSettingsGemini')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const updated = {
      geminiApiKey: $('#geminiApiKey').value
    };
    await api('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    Object.assign(state.profile, updated);
    toast('API Key Gemini berhasil disimpan');
  } catch (e) { toast(e.message, true); }
});

