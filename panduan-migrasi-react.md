# Panduan Migrasi Laporan PKL: Vanilla JS → React (Step 2-8)

> Ditulis khusus buat pemula framework. Tiap step ada penjelasan "kenapa", bukan cuma "apa".
> Asumsi: Express kamu jalan di `http://localhost:3000` dari file `server.js` di root project.

---

## Step 2 — Sambungkan Vite ke Express lewat Proxy

### Kenapa perlu ini?

Vite (dev server React) jalan di port sendiri, misal `5173`. Express kamu jalan di port `3000`. Kalau React langsung `fetch('http://localhost:3000/api/tasks')`, browser akan **memblokir** request itu karena beda origin (port beda = origin beda) — ini namanya masalah **CORS**.

Proxy itu solusinya: kamu bilang ke Vite, "kalau ada request ke `/api/...`, jangan proses sendiri, terusin ke Express di port 3000." Jadi dari sudut pandang browser, semua request tetap ke origin yang sama (Vite), padahal di belakang layar diteruskan ke Express. Nggak perlu setup CORS sama sekali.

### Caranya

Buka `client/vite.config.ts`, akan terlihat seperti ini secara default:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

Tambahkan bagian `server.proxy`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // sesuaikan kalau Express kamu beda port
        changeOrigin: true,
      },
    },
  },
})
```

### Cara ngetest berhasil apa nggak

1. Jalankan Express kamu dulu (`node server.js` di root project, port 3000)
2. Di folder `client/`, jalankan `npm run dev` (Vite biasanya jalan di port 5173)
3. Buka browser ke `http://localhost:5173`, buka DevTools (F12) → tab Console, ketik:
   ```js
   fetch('/api/tasks').then(r => r.json()).then(console.log)
   ```
4. Kalau muncul array data tasks (bukan error CORS/404) → proxy udah jalan bener.

**Kalau error "Failed to fetch" atau connection refused** → berarti Express-nya belum jalan, atau port di `target` salah. Cek port asli Express kamu dari file server utama (cari baris `app.listen(...)`).

---

## Step 3 — Pindahkan Design Tokens (variables.css)

### Kenapa perlu ini?

CSS variables kamu (warna, radius, dll) itu independen dari framework — nggak peduli vanilla JS atau React, CSS tetap CSS. Jadi tinggal dipindah apa adanya biar tampilan nggak berubah pas migrasi.

### Caranya

1. Copy file `public/css/variables.css` ke `client/src/styles/variables.css` (buat folder `styles` kalau belum ada)
2. Import di `client/src/main.tsx` (file paling awal yang dijalankan React), taruh di paling atas:

```tsx
import './styles/variables.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

3. Sekarang semua CSS variable kamu (`--bg-base`, `--primary`, `--radius`, dll) bisa dipakai di file CSS manapun dalam project React, contoh:

```css
/* client/src/components/Card.css */
.card {
  background: var(--bg-surface);
  border-radius: var(--radius);
  color: var(--fg-primary);
}
```

### Soal `theme.js` — apa yang sebenarnya terjadi

Penting buat diluruskan: **`theme.js` sebagai file TIDAK ikut di-copy** ke project React, beda dengan `variables.css` di atas. Alasannya, `variables.css` itu murni CSS (deklaratif, nggak peduli framework), sedangkan `theme.js` isinya kode JavaScript yang manipulasi DOM secara langsung (`$('#btnThemeDark')`, `classList.toggle(...)`, `addEventListener(...)`) — pola ini spesifik ke cara kerja vanilla JS dan **tidak dipakai lagi** di React.

Kalau dibuka lagi, `theme.js` kamu sebenarnya isinya bukan cuma soal tema — dia gabungan beberapa hal yang nggak berhubungan:

| Bagian di `theme.js` | Fungsinya | Nasibnya nanti |
|---|---|---|
| `applyTheme()` | Ganti `data-theme` di HTML + update tombol aktif | Diganti oleh action `setTheme` di store Zustand (Step 4) — logic-nya sama persis, cuma dipindah ke dalam store |
| `toast()` | Nampilin notifikasi kecil di bawah layar | Nanti jadi komponen React `<Toast />` sendiri (bukan bagian dari step ini) |
| `customConfirm()` | Modal konfirmasi custom | Nanti jadi komponen React `<ConfirmModal />` (lihat pola `AnimatePresence` di Step 7) |
| `api()` | Wrapper `fetch` sederhana | Sudah digantikan oleh `client/src/api/client.ts` di Step 5 — nggak perlu dipakai lagi |
| `formatTanggalIndo()`, `weekRangeLabelClient()`, `escapeHtml()` | Fungsi murni, cuma olah data/string, TIDAK sentuh DOM | Ini **boleh** langsung di-copy apa adanya ke file baru, misal `client/src/utils/format.ts`, karena isinya nggak bergantung ke `document`/`window` DOM manipulation |

Di Step 3 ini, kamu **belum perlu nulis kode apa pun** soal tema — nggak ada file yang perlu diedit sekarang untuk bagian ini. Penjelasan di bawah cuma buat kamu paham mekanismenya dulu, sebelum kita beneran pakai di Step 4.

Mekanismenya sesederhana ini — satu baris kode yang nanti akan dipanggil (bukan sekarang, nanti di Step 4):

```ts
document.documentElement.setAttribute('data-theme', 'dark') // atau 'light'
```

Baris ini cukup, karena logic warna apa yang dipakai untuk tiap tema sudah ada di `variables.css` lewat selector `[data-theme="dark"]` dan `[data-theme="light"]` — baris di atas cuma **memicu** perubahan atribut itu, bukan mendefinisikan ulang warnanya.

Di Step 4 di bawah, baris ini akan kita taruh **di dalam action `setTheme`** (bagian dari store Zustand yang kita buat), bukan tersebar di komponen mana pun. Jadi nanti kamu tinggal panggil `setTheme('dark')` dari tombol di komponen manapun, dan store yang urus sisanya (termasuk baca `localStorage` dan cek preferensi sistem, persis seperti `applyTheme()` asli).

---

## Step 4 — State Management Pengganti state.js

### Konsep dasar dulu (penting buat pemula)

Di vanilla JS, kamu punya satu objek global `state` yang ditulis/dibaca langsung dari mana saja (`state.entries = [...]`). Ini kerja, tapi React nggak "tahu" kalau objek biasa berubah — makanya UI nggak akan re-render otomatis.

**Zustand** itu library kecil yang bikin state "reaktif": begitu ada yang ubah data, semua komponen yang pakai data itu otomatis re-render. Konsepnya mirip `state.js` kamu, cuma dibungkus supaya React "notice" perubahannya.

### Install dulu

```bash
cd client
npm install zustand
```

### Bikin store-nya

Buat file `client/src/store/appStore.ts`. Isinya field yang sama persis kayak `state.js` kamu:

```ts
import { create } from 'zustand'

// Tipe data — sesuaikan field-nya dengan kolom database kamu
interface Task {
  id: string
  title: string
  category: string
  subject: string | null
  deadline: string | null
  description: string
  status: string
  attachmentPath: string | null
}

interface Entry {
  id: string
  tanggal: string
  hari: string
  kegiatan: string
  photos: string[]
}

interface Subject {
  id: string
  name: string
}

interface Profile {
  namaPeserta: string
  tempatPkl: string
  namaInstruktur: string
  namaPembimbing: string
  geminiApiKey: string
}

interface AppState {
  // data, persis seperti state.js
  entries: Entry[]
  tasks: Task[]
  subjects: Subject[]
  profile: Profile | null
  editingId: string | null
  searchQuery: string
  taskSort: string
  taskFilter: string
  currentTheme: 'light' | 'dark' | 'system'

  // actions — cara mengubah data di atas
  setEntries: (entries: Entry[]) => void
  setTasks: (tasks: Task[]) => void
  setSubjects: (subjects: Subject[]) => void
  setProfile: (profile: Profile) => void
  setEditingId: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useAppStore = create<AppState>((set) => ({
  // nilai awal
  entries: [],
  tasks: [],
  subjects: [],
  profile: null,
  editingId: null,
  searchQuery: '',
  taskSort: 'date_asc',
  taskFilter: 'all',
  currentTheme: (localStorage.getItem('pkl_theme') as 'light' | 'dark' | 'system') || 'system',

  // actions
  setEntries: (entries) => set({ entries }),
  setTasks: (tasks) => set({ tasks }),
  setSubjects: (subjects) => set({ subjects }),
  setProfile: (profile) => set({ profile }),
  setEditingId: (editingId) => set({ editingId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTheme: (currentTheme) => {
    localStorage.setItem('pkl_theme', currentTheme)

    // sama seperti applyTheme() asli di theme.js: kalau 'system',
    // cek preferensi OS dulu baru tentukan actualTheme
    let actualTheme: 'light' | 'dark' = currentTheme === 'dark' ? 'dark' : 'light'
    if (currentTheme === 'system') {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
      actualTheme = prefersDark ? 'dark' : 'light'
    }

    document.documentElement.setAttribute('data-theme', actualTheme)
    set({ currentTheme })
  },
}))
```

### Cara pakainya di komponen (contoh)

```tsx
import { useAppStore } from '../store/appStore'

function TaskCounter() {
  // ambil cuma field yang dibutuhkan — komponen ini akan re-render
  // otomatis SETIAP KALI tasks berubah, tanpa kode tambahan apapun
  const tasks = useAppStore((state) => state.tasks)

  return <p>Total tugas: {tasks.length}</p>
}
```

Bandingkan dengan vanilla JS kamu yang harus manual panggil `renderTasks()` tiap kali data berubah — di React/Zustand ini otomatis.

---

## Step 5 — Lapisan API Client

### Kenapa perlu file terpisah untuk ini?

Supaya komponen React nggak perlu tahu detail `fetch()`, header, atau FormData. Komponen cukup panggil `getTasks()` atau `createTask(data)` — enak dibaca, gampang di-maintain.

### Bikin filenya

`client/src/api/client.ts` — berdasarkan endpoint asli di `src/routes/tasks.js`, `entries.js`, `subjects.js`, `profile.js`:

```ts
const BASE = '/api' // diteruskan ke Express lewat proxy (Step 2)

// ---------- TASKS ----------
export async function getTasks() {
  const res = await fetch(`${BASE}/tasks`)
  if (!res.ok) throw new Error('Gagal memuat tugas')
  return res.json()
}

export async function getTrashedTasks() {
  const res = await fetch(`${BASE}/tasks/trash`)
  return res.json()
}

// Task pakai FormData karena ada upload attachment (lihat multer di tasks.js)
export async function createTask(data: {
  title: string
  category: string
  subject?: string
  deadline?: string
  description?: string
  referenceUrl?: string
  attachment?: File
}) {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) formData.append(key, value)
  })

  const res = await fetch(`${BASE}/tasks`, {
    method: 'POST',
    body: formData, // JANGAN set Content-Type manual, browser yang atur boundary-nya
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal menambah tugas')
  return res.json()
}

export async function updateTask(id: string, data: Record<string, string>) {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => formData.append(key, value))

  const res = await fetch(`${BASE}/tasks/${id}`, { method: 'PUT', body: formData })
  if (!res.ok) throw new Error('Gagal memperbarui tugas')
  return res.json()
}

export async function deleteTask(id: string) {
  const res = await fetch(`${BASE}/tasks/${id}`, { method: 'DELETE' })
  return res.json()
}

export async function restoreTask(id: string) {
  const res = await fetch(`${BASE}/tasks/${id}/restore`, { method: 'POST' })
  return res.json()
}

// ---------- ENTRIES ----------
export async function getEntries(week?: string) {
  const url = week ? `${BASE}/entries?week=${week}` : `${BASE}/entries`
  const res = await fetch(url)
  return res.json()
}

export async function getEntryWeeks() {
  const res = await fetch(`${BASE}/entries/weeks`)
  return res.json()
}

export async function createEntry(data: { tanggal: string; kegiatan: string; photos?: File[] }) {
  const formData = new FormData()
  formData.append('tanggal', data.tanggal)
  formData.append('kegiatan', data.kegiatan)
  data.photos?.forEach((file) => formData.append('photos', file))

  const res = await fetch(`${BASE}/entries`, { method: 'POST', body: formData })
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal menambah entri')
  return res.json()
}

export async function deleteEntry(id: string, force = false) {
  const res = await fetch(`${BASE}/entries/${id}${force ? '?force=true' : ''}`, { method: 'DELETE' })
  return res.json()
}

// ---------- SUBJECTS ----------
export async function getSubjects() {
  const res = await fetch(`${BASE}/subjects`)
  return res.json()
}

export async function createSubject(name: string) {
  const res = await fetch(`${BASE}/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal menambah mapel')
  return res.json()
}

// ---------- PROFILE ----------
export async function getProfile() {
  const res = await fetch(`${BASE}/profile`)
  return res.json()
}

export async function updateProfile(data: Partial<{
  namaPeserta: string
  tempatPkl: string
  namaInstruktur: string
  namaPembimbing: string
  geminiApiKey: string
}>) {
  const res = await fetch(`${BASE}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}
```

**Poin penting soal upload file:** endpoint `tasks` dan `entries` pakai `multer` di backend (lihat kode aslinya), yang artinya mereka nerima `FormData`, BUKAN JSON biasa. Ini beda dengan `subjects` dan `profile` yang pakai `JSON.stringify`. Kalau kamu bikin endpoint baru nanti, perhatikan mana yang perlu upload file vs yang tidak.

---

## Step 6 — Migrasi Fitur Satu per Satu (mulai dari Profile)

Ini contoh lengkap komponen React pertamamu — Profile, karena paling kecil (110 baris asal).

### Konsep dasar React yang dipakai di sini

- **`useState`** — nyimpen data lokal komponen (misal: isi form saat diketik)
- **`useEffect`** — jalanin kode sekali saat komponen pertama muncul (mirip `init()` di `init.js` kamu)
- **JSX** — cara nulis HTML di dalam JavaScript

### Kodenya

`client/src/features/profile/ProfilePage.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { getProfile, updateProfile } from '../../api/client'
import { useAppStore } from '../../store/appStore'

export function ProfilePage() {
  const profile = useAppStore((state) => state.profile)
  const setProfile = useAppStore((state) => state.setProfile)

  // state lokal buat form — terpisah dari store karena ini "draft" sebelum disimpan
  const [form, setForm] = useState({
    namaPeserta: '',
    tempatPkl: '',
    namaInstruktur: '',
    namaPembimbing: '',
    geminiApiKey: '',
  })
  const [saving, setSaving] = useState(false)

  // ini pengganti loadProfile() yang dipanggil di init.js
  useEffect(() => {
    getProfile().then((data) => {
      setProfile(data)
      setForm(data)
    })
  }, [setProfile])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateProfile(form)
      setProfile(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <h2>Profil Peserta PKL</h2>

      <label>
        Nama Peserta
        <input
          value={form.namaPeserta}
          onChange={(e) => setForm({ ...form, namaPeserta: e.target.value })}
        />
      </label>

      <label>
        Tempat PKL
        <input
          value={form.tempatPkl}
          onChange={(e) => setForm({ ...form, tempatPkl: e.target.value })}
        />
      </label>

      <label>
        Nama Instruktur
        <input
          value={form.namaInstruktur}
          onChange={(e) => setForm({ ...form, namaInstruktur: e.target.value })}
        />
      </label>

      <button type="submit" disabled={saving}>
        {saving ? 'Menyimpan...' : 'Simpan'}
      </button>
    </form>
  )
}
```

### Yang perlu kamu perhatikan dibanding vanilla JS lama

| Vanilla JS (lama) | React (baru) |
|---|---|
| `document.querySelector('#namaPeserta').value` | `form.namaPeserta` (dari `useState`) |
| Manual `addEventListener('input', ...)` | `onChange={(e) => ...}` langsung di JSX |
| Manual `innerHTML = ...` buat update tampilan | Otomatis re-render kalau `state`/`form` berubah |
| `loadProfile()` dipanggil di `init.js` | `useEffect(() => {...}, [])` di dalam komponennya sendiri |

### Urutan migrasi selanjutnya

Setelah Profile jalan lancar, ulangi pola yang sama untuk:
1. **Subjects** (198 baris asal) — mirip Profile, form + list sederhana
2. **Tasks** (377 baris asal) — mulai lebih kompleks karena ada file upload, filter, sort
3. **Entries/Dashboard** (450 baris asal, paling kompleks) — kerjakan terakhir, karena ada upload multi-foto + grouping per minggu

Jangan buru-buru pindah ke fitur berikutnya sebelum yang sekarang beneran jalan dan datanya konsisten dengan backend.

---

## Step 7 — Ganti Animasi Manual ke Framer Motion

### Install

```bash
cd client
npm install framer-motion
```

### Contoh: modal yang smooth buka/tutup

Ini pengganti pola `classList.add('closing')` + `animationend` listener di `state.js` kamu:

```tsx
import { motion, AnimatePresence } from 'framer-motion'

function ConfirmModal({ isOpen, onClose, children }: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

**Kenapa ini lebih baik dari cara lama:** `AnimatePresence` otomatis menunggu animasi keluar (`exit`) selesai sebelum benar-benar menghapus elemen dari DOM — persis yang kamu coba capai manual dengan `animationend` listener + `setTimeout` fallback, tapi tanpa perlu nulis logic itu sendiri dan tanpa risiko race condition.

---

## Step 8 — Build React & Arahkan Express untuk Serve Hasilnya

### Build React jadi file statis

```bash
cd client
npm run build
```

Ini menghasilkan folder `client/dist/` berisi HTML/CSS/JS yang sudah dioptimasi (minified, di-bundle).

### Ubah Express supaya serve folder itu

Di file server utama Express kamu (`server.js` atau sejenisnya), cari baris:

```js
app.use(express.static('public'))
```

Ganti/tambahkan jadi:

```js
const path = require('path')

// Serve hasil build React
app.use(express.static(path.join(__dirname, 'client', 'dist')))

// PENTING: fallback route untuk client-side routing
// Kalau nanti kamu pakai React Router, semua route yang bukan /api
// harus tetap kembalikan index.html, biar React yang urus routing-nya
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next() // jangan ganggu API routes
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'))
})
```

### Checklist sebelum hapus folder public/ lama

- [ ] Semua tab (Dashboard, Tasks, Subjects, Profile) sudah dimigrasi dan berfungsi normal
- [ ] Upload foto/attachment sudah dicoba dan berhasil
- [ ] Dark/light theme toggle masih bekerja
- [ ] `npm run build` di `client/` tidak ada error
- [ ] Sudah dicoba jalan penuh dari Express (bukan dari Vite dev server) — jalankan `node server.js` lalu buka `http://localhost:3000`

Kalau semua checklist di atas ✅, baru folder `public/js` yang lama aman dihapus.
