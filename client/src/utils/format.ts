/* Pure utility functions — ported from theme.js */

import { getHoliday } from './holidays'

export function formatTanggalIndo(tanggal: string | null | undefined): string {
  if (!tanggal) return '-'
  const cleanDate = typeof tanggal === 'string' && tanggal.includes('T') ? tanggal.split('T')[0] : String(tanggal)
  const parts = cleanDate.split('-')
  if (parts.length < 3) return cleanDate
  const y = Number(parts[0])
  const m = Number(parts[1])
  const d = Number(parts[2])
  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12) return cleanDate
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${String(d).padStart(2, '0')} ${bulan[m - 1]} ${y}`
}

export function weekRangeLabelClient(mondayKey: string, entries: { tanggal: string }[] = []): string {
  const bulanSingkat = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
  const [y, m, d] = mondayKey.split('-').map(Number)

  let numDays = 5
  if (entries && entries.length > 0) {
    const hasSat = entries.some(e => new Date(e.tanggal).getDay() === 6)
    const hasSun = entries.some(e => new Date(e.tanggal).getDay() === 0)
    if (hasSun) numDays = 7
    else if (hasSat) numDays = 6
  }

  const days: Date[] = []
  for (let i = 0; i < numDays; i++) {
    days.push(new Date(y, m - 1, d + i))
  }

  let startIdx = 0
  while (startIdx < days.length) {
    const dStr = `${days[startIdx].getFullYear()}-${String(days[startIdx].getMonth() + 1).padStart(2, '0')}-${String(days[startIdx].getDate()).padStart(2, '0')}`
    if (getHoliday(dStr)) startIdx++
    else break
  }
  if (startIdx === days.length) startIdx = 0

  let endIdx = days.length - 1
  while (endIdx >= startIdx) {
    const dStr = `${days[endIdx].getFullYear()}-${String(days[endIdx].getMonth() + 1).padStart(2, '0')}-${String(days[endIdx].getDate()).padStart(2, '0')}`
    if (getHoliday(dStr)) endIdx--
    else break
  }

  const startDate = days[startIdx]
  const endDate = days[endIdx]

  if (startDate.getMonth() === endDate.getMonth()) {
    if (startDate.getDate() === endDate.getDate()) {
      return `${startDate.getDate()} ${bulanSingkat[startDate.getMonth()]} ${startDate.getFullYear()}`
    }
    return `${startDate.getDate()} - ${endDate.getDate()} ${bulanSingkat[startDate.getMonth()]} ${startDate.getFullYear()}`
  }
  return `${startDate.getDate()} ${bulanSingkat[startDate.getMonth()]} - ${endDate.getDate()} ${bulanSingkat[endDate.getMonth()]} ${endDate.getFullYear()}`
}

export function escapeHtml(str: string | null | undefined): string {
  const div = document.createElement('div')
  div.textContent = str || ''
  return div.innerHTML
}

export function getWeekKey(tanggal: string): string {
  const [y, m, d] = tanggal.split('-').map(Number)
  const dateObj = new Date(y, m - 1, d)
  const dow = (dateObj.getDay() + 6) % 7
  const monObj = new Date(dateObj)
  monObj.setDate(dateObj.getDate() - dow)
  return `${monObj.getFullYear()}-${String(monObj.getMonth() + 1).padStart(2, '0')}-${String(monObj.getDate()).padStart(2, '0')}`
}

export function getDayName(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  return dayNames[dt.getDay()]
}

export function todayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
