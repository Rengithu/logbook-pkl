const dayjs = require('dayjs');
const getHoliday = require('../../public/js/holiday');
const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jumat", 'Sabtu'];
const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function namaHari(dateStr) {
  const d = dayjs(dateStr);
  return HARI_ID[d.day()];
}

function tanggalIndo(dateStr) {
  const d = dayjs(dateStr);
  const tgl = String(d.date()).padStart(2, '0');
  return `${tgl} ${BULAN_ID[d.month()]} ${d.year()}`;
}

function hariTanggalIndo(dateStr) {
  return `${namaHari(dateStr)}, ${tanggalIndo(dateStr)}`;
}

// Returns a stable key identifying the Mon-Sun week a date falls in, e.g. "2026-W32"
function weekKey(dateStr) {
  const d = dayjs(dateStr);
  // ISO week: Monday start
  const dow = (d.day() + 6) % 7; // 0=Mon ... 6=Sun
  const monday = d.subtract(dow, 'day');
  return monday.format('YYYY-MM-DD'); // key = Monday's date of that week
}

function weekRangeLabel(mondayKey, entries = []) {
  let daysCount = 5;
  if (entries && entries.length > 0) {
    const hasSat = entries.some(e => dayjs(e.tanggal).day() === 6);
    const hasSun = entries.some(e => dayjs(e.tanggal).day() === 0);
    if (hasSun) daysCount = 7;
    else if (hasSat) daysCount = 6;
  }
  
  const days = [];
  for (let i = 0; i < daysCount; i++) {
    days.push(dayjs(mondayKey).add(i, 'day'));
  }

  let startIdx = 0;
  while (startIdx < days.length && getHoliday(days[startIdx].format('YYYY-MM-DD'))) {
    startIdx++;
  }
  if (startIdx === days.length) startIdx = 0;

  let endIdx = days.length - 1;
  while (endIdx >= startIdx && getHoliday(days[endIdx].format('YYYY-MM-DD'))) {
    endIdx--;
  }

  const startDay = days[startIdx];
  const endDay = days[endIdx];

  if (startDay.isSame(endDay, 'day')) {
    return tanggalIndo(startDay.format('YYYY-MM-DD'));
  }
  return `${tanggalIndo(startDay.format('YYYY-MM-DD'))} - ${tanggalIndo(endDay.format('YYYY-MM-DD'))}`;
}


module.exports = { namaHari, tanggalIndo, hariTanggalIndo, weekKey, weekRangeLabel, HARI_ID, BULAN_ID };
