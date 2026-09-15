import { useRef, useState } from 'react'
import { Modal } from '../../components/Modal'
import { CustomDatePicker } from '../../components/CustomDatePicker'
import { useAppStore } from '../../store/appStore'
import * as api from '../../api/client'

const COLORS = ['#e91e63', '#9c27b0', '#3f51b5', '#009688', '#ff9800', '#795548', '#607d8b', '#f44336']

export function AddTaskModal() {
  const isOpen = useAppStore((s) => s.isAddTaskModalOpen)
  const onClose = useAppStore((s) => s.closeAddTaskModal)
  const editingTask = useAppStore((s) => s.editingTask)
  const tasks = useAppStore((s) => s.tasks)
  const setTasks = useAppStore((s) => s.setTasks)
  const subjects = useAppStore((s) => s.subjects)
  const showToast = useAppStore((s) => s.showToast)

  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [referenceUrl, setReferenceUrl] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [removeAttachment, setRemoveAttachment] = useState(false)
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false)
  const [subjectSearch, setSubjectSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const isSubmittingRef = useRef(false)

  // Sync form with editingTask
  const isEditing = !!editingTask
  useState(() => {
    // This runs on mount only
  })

  // Reset form when modal opens
  if (isOpen && editingTask && title === '' && deadline === '' && subject === '' && description === '' && referenceUrl === '') {
    setTitle(editingTask.title)
    setDeadline(editingTask.deadline || '')
    setSubject(editingTask.subject || '')
    setDescription(editingTask.description || '')
    setReferenceUrl(editingTask.referenceUrl || '')
  }

  function handleClose() {
    setTitle('')
    setDeadline('')
    setSubject('')
    setDescription('')
    setReferenceUrl('')
    setAttachment(null)
    setRemoveAttachment(false)
    setSubjectDropdownOpen(false)
    setSubjectSearch('')
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setSaving(true)
    const data: Record<string, string | File> = {
      title,
      category: 'Sekolah',
    }
    if (deadline) data.deadline = deadline
    if (subject) data.subject = subject
    data.description = description
    if (referenceUrl) data.referenceUrl = referenceUrl
    if (attachment) data.attachment = attachment
    if (removeAttachment) data.removeAttachment = 'true'

    try {
      if (editingTask) {
        const updated = await api.updateTask(editingTask.id, data)
        setTasks(tasks.map(t => t.id === editingTask.id ? updated : t))
        showToast('Tugas diperbarui')
      } else {
        const newTask = await api.createTask(data as any)
        setTasks([...tasks, newTask])
        showToast('Tugas ditambahkan')
      }
      handleClose()
    } catch (err: any) {
      showToast(err.message, true)
    } finally {
      isSubmittingRef.current = false
      setSaving(false)
    }
  }

  const filteredSubjects = subjects.filter(s =>
    !subjectSearch || s.name.toLowerCase().includes(subjectSearch.toLowerCase())
  )

  return (
    <Modal isOpen={isOpen} onClose={handleClose} style={{ maxWidth: 500 }}>
      <div className="modal-header">
        <div>
          <h2 className="modal-title">{isEditing ? 'Edit Tugas' : 'Tambah Tugas'}</h2>
          <p className="modal-sub">Tugas tidak akan masuk ke Laporan PKL</p>
        </div>
        <button type="button" className="btn-close" onClick={handleClose} title="Tutup">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <form id="formAddTask" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="modal-body">
          <div className="form-row">
            <label htmlFor="taskTitle">Judul Tugas</label>
            <input type="text" id="taskTitle" required placeholder="Contoh: Revisi Bab 1 Laporan PKL" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-row" style={{ display: 'block', marginBottom: 0 }}>
              <label>Mata Pelajaran (Opsional)</label>
              <div className={`custom-select-wrapper ${subjectDropdownOpen ? 'open' : ''}`}>
                <div className="custom-select-trigger" onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}>
                  <div className="custom-select-value">
                    <div className="custom-select-placeholder" style={{ color: subject ? 'var(--fg-primary)' : 'var(--fg-muted)' }}>
                      {subject || '-- Pilih Mapel --'}
                    </div>
                  </div>
                  <span className="material-symbols-outlined custom-select-arrow">arrow_drop_down</span>
                </div>
                <div className="custom-select-dropdown">
                  <div className="custom-select-search-box">
                    <span className="material-symbols-outlined search-icon">search</span>
                    <input type="text" placeholder="Cari mapel..." autoComplete="off" value={subjectSearch} onChange={e => setSubjectSearch(e.target.value)} onClick={e => e.stopPropagation()} />
                  </div>
                  <div className="custom-select-options">
                    <div className="custom-select-option" onClick={() => { setSubject(''); setSubjectDropdownOpen(false) }}>
                      <div className="option-avatar" style={{ background: 'transparent', color: 'var(--fg-muted)', fontSize: 16 }}>
                        <span className="material-symbols-outlined">block</span>
                      </div>
                      <div className="option-label">-- Kosongkan Mapel --</div>
                    </div>
                    {filteredSubjects.map((sub, i) => (
                      <div key={sub.id} className={`custom-select-option ${subject === sub.name ? 'selected' : ''}`} onClick={() => { setSubject(sub.name); setSubjectDropdownOpen(false) }}>
                        <div className="option-avatar" style={{ background: COLORS[i % COLORS.length] }}>{sub.name.charAt(0).toUpperCase()}</div>
                        <div className="option-label">{sub.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <label htmlFor="taskDeadline">Tenggat Waktu (Opsional)</label>
              <CustomDatePicker value={deadline} onChange={setDeadline} />
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="taskDescription">Deskripsi / Catatan (Opsional)</label>
            <textarea id="taskDescription" rows={2} placeholder="Contoh: Tonton dari menit 10:00 - 15:00" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <label htmlFor="taskReferenceUrl">Tautan URL (Opsional)</label>
              <input type="url" id="taskReferenceUrl" placeholder="https://youtube.com/..." value={referenceUrl} onChange={e => setReferenceUrl(e.target.value)} />
            </div>
            <div className="form-row" style={{ marginBottom: 0 }}>
              <label htmlFor="taskAttachment">Lampiran (Opsional)</label>
              <input
                type="file"
                id="taskAttachment"
                accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                style={{ padding: 8, fontSize: 13 }}
                onChange={e => {
                  const f = e.target.files?.[0] || null
                  setAttachment(f)
                  if (f) setRemoveAttachment(false) // memilih file baru = membatalkan hapus lampiran
                }}
              />
            </div>
          </div>

          {/* Lampiran yang sudah tersimpan (mode edit) dengan tombol hapus */}
          {isEditing && editingTask?.attachmentPath && !attachment && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: removeAttachment ? 'var(--danger)' : 'var(--fg-secondary)' }}>
                {removeAttachment ? 'delete' : 'attach_file'}
              </span>
              <span
                style={{
                  color: removeAttachment ? 'var(--danger)' : 'var(--fg-primary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}
                title={editingTask.attachmentName || 'Lampiran'}
              >
                {editingTask.attachmentName || 'Lampiran'}{removeAttachment ? ' — akan dihapus saat disimpan' : ''}
              </span>
              <button
                type="button"
                className="btn-icon btn-sm"
                title={removeAttachment ? 'Batalkan Hapus Lampiran' : 'Hapus Lampiran'}
                onClick={() => setRemoveAttachment(!removeAttachment)}
                style={{ marginLeft: 'auto', flexShrink: 0, width: 24, height: 24 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  {removeAttachment ? 'undo' : 'close'}
                </span>
              </button>
              {!removeAttachment && (
                <a
                  href={`/uploads/${editingTask.attachmentPath}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Buka lampiran"
                  className="btn-icon btn-sm"
                  style={{ flexShrink: 0, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                </a>
              )}
            </div>
          )}

        </div>
        <div style={{ display: 'flex', width: '100%', margin: 0, padding: 0 }}>
          <button type="button" className="btn-modal-footer-left" onClick={handleClose}>
            Batal
          </button>
          <button type="submit" className="btn-modal-footer-right" disabled={saving}>
            <span className="material-symbols-outlined">save</span>
            <span>{saving ? 'Menyimpan...' : (isEditing ? 'Perbarui Tugas' : 'Simpan Tugas')}</span>
          </button>
        </div>
      </form>
    </Modal>
  )
}
