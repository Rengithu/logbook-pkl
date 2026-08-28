# Laporan PKL & Task Manager (Modern React Version)

Aplikasi *web full-stack* komprehensif untuk mencatat kegiatan harian Praktik Kerja Lapangan (PKL), memanajemen tugas sekolah/kampus, dan mengekspor laporan akhir secara otomatis ke dalam format **Word (.docx)** dan **PDF**. 

Aplikasi ini telah dimodernisasi menggunakan **React (Vite) + TypeScript** di sisi *frontend* dan **Node.js + SQLite** di sisi *backend*, menghadirkan pengalaman pengguna (*User Experience*) setara aplikasi *mobile* tingkat lanjut.

## ✨ Fitur Utama

- **📝 Jurnal PKL Dinamis (Harian & Mingguan)**
  - Catat pekerjaan dan unggah dokumentasi foto.
  - **Sistem Kalender Pintar**: Mengelompokkan jurnal secara dinamis ke dalam rentang minggu (mendukung 5 hari kerja, 6 hari, maupun lembur di akhir pekan secara otomatis).
  - Ekspor ke **Word & PDF** siap cetak.
- **🖨️ Cetak Tajam & Ringan (Smart Compression)**
  - Foto dikompresi menggunakan algoritma *MozJPEG* (`sharp`), menghasilkan *file* berukuran sangat kecil (mudah di-*share*) tanpa mengorbankan ketajaman gambar saat diprint di kertas A4.
- **✅ Papan Manajemen Tugas (Task Board)**
  - Pantau dan kelola tugas (Belum Mulai, Proses, Selesai).
  - Klasifikasi berdasarkan *Mata Pelajaran*, indikator batas waktu (*deadline*), dan penyortiran cerdas.
- **📱 Mobile-First UI & Responsive Design**
  - Desain antarmuka modern yang sangat ramah perangkat seluler (HP).
  - *Bottom Navigation Bar*, *Floating Action Button (FAB)*, mode tampilan *Grid/List* yang responsif.
- **🤖 Asisten AI Terintegrasi (Gemini)**
  - *Floating AI Chat Panel* siap membantu Anda merangkum, memparafrase, atau memberikan variasi bahasa penulisan jurnal agar tidak monoton.
- **🗑️ Tempat Sampah (Recycle Bin)**
  - Fitur *soft-delete* yang memungkinkan Anda mengembalikan jurnal atau tugas yang tidak sengaja terhapus.

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Zustand (State Management), React Router.
- **Backend:** Node.js, Express.js.
- **Database:** SQLite (`better-sqlite3`).
- **Generator Dokumen:** `docx`, `pdfkit`.
- **Pemroses Gambar:** `sharp`.

## Known Issues
- `image-size` (dependency untuk proses gambar) punya 2 celah keamanan DoS (level High) terkait parsing file ICNS/JXL/HEIF. Fix resmi (`image-size` v2+) memerlukan migrasi backend ke ESM. Karena aplikasi ini dijalankan secara lokal oleh masing-masing pengguna (bukan server publik yang menerima upload dari pihak tak dikenal), risiko eksploitasinya rendah. Rekomendasi: hindari upload file berformat ICNS/HEIF/JXL yang tidak familiar sampai isu ini diperbaiki.

## 🚀 Panduan Menjalankan Aplikasi (Lokal)

Pastikan Anda telah menginstal [Node.js](https://nodejs.org) (minimal versi 18).

### 1. Instalasi Dependensi
Anda perlu menginstal *library* untuk backend dan frontend. Buka terminal dan ketik:
```bash
# Install library backend (di folder utama)
npm install

# Masuk ke folder client dan install library frontend
cd client
npm install
cd ..
```

### 2. Mengaktifkan AI (Opsional)
Untuk menggunakan asisten AI, buat akun di [Google AI Studio](https://aistudio.google.com/app/apikey) dan dapatkan API Key.
- Salin file `.env.example` menjadi `.env` di folder utama.
- Isi `GEMINI_API_KEY=KODE_RAHASIA_ANDA`.

### 3. Menjalankan Aplikasi
Gunakan perintah ini untuk mem-*build* antarmuka React dan langsung menjalankan *server*:
```bash
npm run build:start
```
Aplikasi kini dapat diakses melalui browser di alamat: **http://localhost:3000**

*(Catatan untuk Developer: Jika ingin memodifikasi tampilan UI secara langsung/Hot-Reload, jalankan `npm run dev` pada folder `client` dan biarkan server berjalan di terminal terpisah).*

## 📁 Struktur Direktori

```
pkl-report-app/
├── client/              # [BARU] Frontend React (Vite, TSX)
│   ├── src/
│   │   ├── components/  # Komponen UI Reusable (Modal, Sidebar, AI Chat)
│   │   ├── features/    # Logika spesifik per halaman (Dashboard, Tasks, Entries)
│   │   └── styles/      # CSS Global & Variabel Tema
├── src/                 # Backend Node.js
│   ├── db/              # Konfigurasi SQLite
│   ├── generators/      # Script pembuat Word & PDF (Docx, PDFKit, Sharp)
│   ├── routes/          # API Endpoints (Express Router)
│   └── utils/           # Fungsi pembantu (Tanggal, Holiday logic)
├── uploads/             # Folder penyimpanan foto lokal (Jangan dihapus)
├── database.sqlite      # File Database utama (Dibuat otomatis)
├── .stignore            # [BARU] Aturan sinkronisasi Syncthing
└── server.js            # Entry point Backend
```

## 🤝 Membagikan Aplikasi ke Teman

Aplikasi ini menggunakan sistem *database* lokal yang sepenuhnya berada di komputer Anda demi menjaga privasi penuh.
Jika Anda ingin membagikan aplikasi ini ke teman agar ia bisa memiliki laporan PKL-nya sendiri:

1. **Gunakan ZIP Bersih**: Gandakan folder ini, lalu **hapus** folder `node_modules`, `client/node_modules`, file `database.sqlite*`, dan kosongkan folder `uploads/`. Jadikan ZIP dan kirim ke teman Anda. Saat teman Anda mengekstrak dan menjalankan `npm install` + `npm run build:start`, aplikasi akan membuatkan *database* baru yang kosong untuknya.
2. **Gunakan GitHub & Glitch**: *Push* kode *project* ini ke GitHub (konfigurasi `.gitignore` sudah otomatis mengecualikan *database*). Teman Anda bisa me-*remix* *repository* Anda di platform gratis seperti Glitch.com untuk mendapatkan server aplikasinya sendiri yang bisa diakses murni lewat HP tanpa perlu instalasi rumit! (Sangat direkomendasikan).
3. **Menggunakan Syncthing**: File `.stignore` sudah dikonfigurasi untuk mengecualikan direktori *cache* dan *database*. Anda dapat melakukan sinkronisasi dengan mulus.

---
**Catatan Trouble-shooting:**
- Jika ekspor PDF/Word gagal, pastikan foto yang dilampirkan tidak rusak/korup.
- Jika antarmuka (*UI*) berubah kosong (putih) di browser, pastikan Anda telah menjalankan perintah `npm run build:start` dan bukan sekadar `npm start`, karena file statis React (`client/dist`) harus di-*build* terlebih dahulu sebelum disajikan oleh server.
