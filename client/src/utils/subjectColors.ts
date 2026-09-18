// Palet warna avatar mapel — konsisten berdasarkan hash nama,
// bukan posisi index di daftar terfilter atau panjang string.
const SUBJECT_COLORS = ['#e91e63', '#9c27b0', '#3f51b5', '#009688', '#ff9800', '#795548', '#607d8b', '#f44336']

/** Warna identitas yang selalu sama untuk nama mapel yang sama. */
export function colorForSubject(name: string): string {
  if (!name) return '#83a598'
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length]
}
