const BASE = import.meta.env.VITE_API_URL || '/api' // Memanfaatkan environment variables Vite

// Helper khusus agar semua Request otomatis membawa Header Otorisasi & Cookies
async function apiFetch(endpoint: string, options: RequestInit = {}) {
    // Ambil token dari local storage (jika aplikasi Anda menggunakan JWT Token)
    const token = localStorage.getItem('access_token')

    const headers = new Headers(options.headers || {})
    
    // Injeksi Token Otorisasi
    if (token) {
        headers.set('Authorization', `Bearer ${token}`)
    }

    const res = await fetch(`${BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Penting agar sesi/cookies tidak ditolak oleh Server (CORS)
    })
    return res
}

// ---------- TASKS ----------
export async function getTasks() {
    const res = await apiFetch('/tasks')
    if (!res.ok) throw new Error('Gagal memuat tugas')
    return res.json()
}

export async function getTrashedTasks() {
    const res = await apiFetch('/tasks/trash')
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

    const res = await apiFetch('/tasks', {
        method: 'POST',
        body: formData, // JANGAN set Content-Type manual, browser yang atur boundary-nya
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Gagal menambah tugas')
    return res.json()
}

export async function updateTask(id: string, data: any) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value as string | Blob)
    })

    const res = await apiFetch(`/tasks/${id}`, { method: 'PUT', body: formData })
    if (!res.ok) throw new Error('Gagal memperbarui tugas')
    return res.json()
}

export async function deleteTask(id: string, force = false) {
    const res = await apiFetch(`/tasks/${id}${force ? '?force=true' : ''}`, { method: 'DELETE' })
    return res.json()
}

export async function deleteTaskForever(id: string) {
    const res = await apiFetch(`/tasks/${id}/force`, { method: 'DELETE' })
    return res.json()
}

export async function restoreTask(id: string) {
    const res = await apiFetch(`/tasks/${id}/restore`, { method: 'POST' })
    return res.json()
}

// ---------- ENTRIES ----------
export async function getEntries(week?: string) {
    const url = week ? `/entries?week=${week}` : '/entries'
    const res = await apiFetch(url)
    return res.json()
}

export async function getTrashedEntries() {
    const res = await apiFetch('/entries/trash')
    return res.json()
}

export async function getEntryWeeks() {
    const res = await apiFetch('/entries/weeks')
    return res.json()
}

export async function createEntry(data: { tanggal: string; kegiatan: string; photos?: File[] }) {
    const formData = new FormData()
    formData.append('tanggal', data.tanggal)
    formData.append('kegiatan', data.kegiatan)
    data.photos?.forEach((file) => formData.append('photos', file))

    const res = await apiFetch('/entries', { method: 'POST', body: formData })
    if (!res.ok) throw new Error((await res.json()).error || 'Gagal menambah entri')
    return res.json()
}

export async function updateEntry(id: string, data: any) {
    const formData = new FormData()
    if (data.tanggal) formData.append('tanggal', data.tanggal)
    if (data.kegiatan) formData.append('kegiatan', data.kegiatan)
    if (data.removePhotos) formData.append('removePhotos', JSON.stringify(data.removePhotos))
    data.photos?.forEach((file: File) => formData.append('photos', file))

    const res = await apiFetch(`/entries/${id}`, { method: 'PUT', body: formData })
    if (!res.ok) throw new Error((await res.json()).error || 'Gagal mengedit entri')
    return res.json()
}

export async function deleteEntry(id: string, force = false) {
    const res = await apiFetch(`/entries/${id}${force ? '?force=true' : ''}`, { method: 'DELETE' })
    return res.json()
}

export async function restoreEntry(id: string) {
    const res = await apiFetch(`/entries/${id}/restore`, { method: 'PUT' })
    return res.json()
}

// ---------- SUBJECTS ----------
export async function getSubjects() {
    const res = await apiFetch('/subjects')
    return res.json()
}

export async function getTrashedSubjects() {
    const res = await apiFetch('/subjects/trash')
    return res.json()
}

export async function deleteSubject(id: string) {
    const res = await apiFetch(`/subjects/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).error || 'Gagal menghapus mapel')
    return res.json()
}

export async function deleteSubjectForever(id: string) {
    const res = await apiFetch(`/subjects/${id}/force`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).error || 'Gagal menghapus permanen')
    return res.json()
}

export async function restoreSubject(id: string) {
    const res = await apiFetch(`/subjects/${id}/restore`, { method: 'POST' })
    return res.json()
}

export async function createSubject(name: string) {
    const res = await apiFetch('/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Gagal menambah mapel')
    return res.json()
}

// ---------- PROFILE ----------
export async function getProfile() {
    const res = await apiFetch('/profile')
    return res.json()
}

export async function updateProfile(data: Partial<{
    namaPeserta: string
    tempatPkl: string
    namaInstruktur: string
    namaPembimbing: string
    geminiApiKey: string
    apiProvider: 'gemini' | 'openrouter' | 'ollama'
    openRouterApiKey: string
    ollamaUrl: string
}>) {
    const res = await apiFetch('/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    return res.json()
}

export async function aiRephrase(text: string) {
    const res = await apiFetch('/ai/rephrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Gagal AI rephrase')
    return res.json()
}

// ---------- TOOLS ----------
export async function convertImageToPdf(files: File[]) {
    const formData = new FormData()
    files.forEach(file => formData.append('photos', file))

    // Don't use apiFetch for download because we need the blob response
    const token = localStorage.getItem('access_token')
    const headers = new Headers()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const res = await fetch('/api/tools/img2pdf', {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include'
    })
    
    if (!res.ok) {
        let errStr = 'Gagal konversi ke PDF'
        try {
            const data = await res.json()
            if (data.error) errStr = data.error
        } catch (e) {}
        throw new Error(errStr)
    }

    return res.blob()
}