import { useState, useRef } from 'react'
import { Modal } from '../../components/Modal'
import { CustomDropdown } from '../../components/CustomDropdown'
import { CustomDatePicker } from '../../components/CustomDatePicker'
import { useAppStore } from '../../store/appStore'
import * as apiClient from '../../api/client'
import { todayStr } from '../../utils/format'

const TEMPLATES: Record<string, string> = {
  sarpras: 'Melakukan perbaikan dan perawatan perangkat, seperti instalasi ulang sistem operasi pada komputer. Selain itu, membantu keperluan operasional sarana dan prasarana umum, misalnya mengganti lampu ruangan yang mati, serta memberikan bantuan teknis IT Support secara keseluruhan sesuai dengan arahan dari instruktur.',
  front_office: 'Melayani tamu dan pengunjung yang datang ke area resepsionis dengan baik. Selain itu, melakukan pekerjaan administratif berupa pemindahan atau penginputan data pengunjung dari buku tamu fisik ke dalam format data Microsoft Excel.',
  perpustakaan: 'Melakukan proses pendataan serta penginputan kelengkapan data buku perpustakaan ke dalam sistem database agar tercatat dengan rapi dan terstruktur.',
}

export function AddEntryModal() {
  const isOpen = useAppStore((s) => s.isAddEntryModalOpen)
  const onClose = useAppStore((s) => s.closeAddEntryModal)
  const editingId = useAppStore((s) => s.editingId)
  const entries = useAppStore((s) => s.entries)
  const setEntries = useAppStore((s) => s.setEntries)
  const showToast = useAppStore((s) => s.showToast)

  const [tanggal, setTanggal] = useState(todayStr())
  const [kegiatan, setKegiatan] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiStatus, setAiStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editingEntry = editingId ? entries.find(e => e.id === editingId) : null
  const isEditing = !!editingEntry

  // Sync form when editing
  if (isOpen && editingEntry && kegiatan === '' && tanggal === todayStr()) {
    setTanggal(editingEntry.tanggal)
    setKegiatan(editingEntry.kegiatan)
  }

  function handleClose() {
    setTanggal(todayStr())
    setKegiatan('')
    setPhotos([])
    setRemovedPhotos([])
    setAiStatus('')
    onClose()
  }

  function handlePhotoAdd(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    setPhotos(prev => [...prev, ...newFiles])
  }

  function handleTemplateSelect(value: string) {
    if (!value || !TEMPLATES[value]) return
    const text = TEMPLATES[value]
    setKegiatan(prev => prev.trim() ? prev + '\n\n' + text : text)
    showToast('Template teks berhasil ditambahkan ke isian')
  }

  async function handleAiRephrase() {
    if (!kegiatan.trim()) {
      showToast('Isi dulu kegiatannya sebelum minta bantuan AI', true)
      return
    }
    setAiLoading(true)
    setAiStatus('Sedang menyusun ulang teks dengan AI...')
    try {
      const result = await apiClient.aiRephrase(kegiatan)
      setKegiatan(result.text)
      setAiStatus('Selesai — periksa lagi hasilnya sebelum disimpan.')
      showToast('Teks berhasil dibuat variasi oleh AI')
    } catch (e: any) {
      setAiStatus(e.message)
      showToast(e.message, true)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await apiClient.updateEntry(editingId, { tanggal, kegiatan, photos, removePhotos: removedPhotos })
        showToast('Catatan berhasil diperbarui')
      } else {
        await apiClient.createEntry({ tanggal, kegiatan, photos })
        showToast('Catatan berhasil disimpan')
      }
      // Reload entries
      const data = await apiClient.getEntries()
      setEntries(data)
      handleClose()
    } catch (e: any) {
      showToast(e.message, true)
    } finally {
      setSaving(false)
    }
  }

  const existingPhotos = editingEntry?.photos?.filter(p => !removedPhotos.includes(p)) || []

  return (
    <Modal isOpen={isOpen} onClose={handleClose} style={{ maxWidth: 700, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '90vh' }}>
      <div className="modal-header" style={{ flexShrink: 0, borderBottom: '1px solid var(--border)', padding: '20px 24px' }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>{isEditing ? 'Edit Catatan Harian' : 'Tambah Catatan Harian'}</h2>
        <button className="btn-icon" onClick={handleClose} style={{ margin: '-8px -8px -8px 0' }}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
        <div className="modal-body" style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          <div className="form-row">
            <label className="m3-label">
              <span className="material-symbols-outlined label-icon">calendar_today</span>
              <span>Tanggal Kegiatan</span>
            </label>
            <CustomDatePicker value={tanggal} onChange={setTanggal} />
          </div>

          <div className="form-row">
            <label className="m3-label">
              <span className="material-symbols-outlined label-icon">edit_note</span>
              <span>Nama Pekerjaan & Pelaksanaan Kegiatan / Hasil</span>
            </label>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CustomDropdown
                value=""
                placeholder="Gunakan Template Cepat..."
                onChange={handleTemplateSelect}
                options={[
                  { value: 'sarpras', label: 'Sarana Prasarana (IT Support / Teknisi)' },
                  { value: 'front_office', label: 'Front Office (Layanan & Buku Tamu)' },
                  { value: 'perpustakaan', label: 'Perpustakaan (Input Buku)' }
                ]}
              />
            </div>
            <div className="m3-textarea-wrapper unified">
              <textarea
                className="m3-textarea"
                rows={4}
                required
                placeholder="Contoh: Melakukan instalasi ulang sistem operasi pada 5 unit komputer lab..."
                value={kegiatan}
                onChange={e => setKegiatan(e.target.value)}
              />
              <div className="ai-toolbar unified">
                <button 
                  type="button" 
                  className="btn-clear-unified" 
                  onClick={() => setKegiatan('')}
                  title="Hapus semua teks"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_sweep</span>
                </button>
                <button type="button" className="btn-gemini-ai unified" onClick={handleAiRephrase} disabled={aiLoading}>
                  <span className="material-symbols-outlined gemini-sparkle">auto_awesome</span>
                  <span>Buatkan Variasi dengan AI</span>
                </button>
              </div>
            </div>
            {aiStatus && <span className="ai-status" style={{ marginTop: 8, display: 'block', fontSize: 13, color: 'var(--fg-secondary)' }}>{aiStatus}</span>}
          </div>

          <div className="form-row">
            <label>Foto Dokumentasi <span className="optional">(opsional, bisa lebih dari satu)</span></label>
            <div
              className="gdrive-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
              onDrop={e => { e.preventDefault(); e.stopPropagation(); handlePhotoAdd(e.dataTransfer.files) }}
            >
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple style={{ display: 'none' }} onChange={e => handlePhotoAdd(e.target.files)} />
              <div className="gdrive-dropzone-content">
                <div className="gdrive-icon-wrapper">
                  <span className="material-symbols-outlined gdrive-icon">cloud_upload</span>
                </div>
                <div className="gdrive-text">
                  <p className="gdrive-main-text">Tarik & lepas foto di sini, atau <span className="gdrive-browse-link">Jelajahi File</span></p>
                  <p className="gdrive-sub-text">Mendukung format JPG, PNG, WebP (bisa pilih banyak foto)</p>
                </div>
              </div>
            </div>

            {/* Existing photos (edit mode) */}
            {existingPhotos.length > 0 && (
              <div className="photo-chip-list">
                {existingPhotos.map(p => (
                  <div key={p} className="photo-chip">
                    <img src={`/uploads/${p}`} alt="" />
                    <button type="button" className="remove-btn" onClick={() => setRemovedPhotos([...removedPhotos, p])}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New photo previews */}
            {photos.length > 0 && (
              <div className="photo-preview-list">
                {photos.map((file, i) => (
                  <div key={i} className="photo-chip">
                    <img src={URL.createObjectURL(file)} alt="" title={file.name} />
                    <button type="button" className="remove-btn" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', width: '100%', margin: 0, padding: 0 }}>
          <button type="button" className="btn-modal-footer-left" onClick={handleClose}>
            Batal
          </button>
          <button type="submit" className="btn-modal-footer-right" disabled={saving}>
            <span className="material-symbols-outlined">save</span>
            <span>{saving ? 'Menyimpan...' : (isEditing ? 'Perbarui Catatan' : 'Simpan Catatan')}</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}
