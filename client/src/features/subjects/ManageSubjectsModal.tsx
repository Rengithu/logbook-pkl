import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { useAppStore } from '../../store/appStore'
import * as api from '../../api/client'

export function ManageSubjectsModal() {
  const isOpen = useAppStore((s) => s.isManageSubjectsModalOpen)
  const onClose = useAppStore((s) => s.closeManageSubjectsModal)
  const subjects = useAppStore((s) => s.subjects)
  const setSubjects = useAppStore((s) => s.setSubjects)
  const showToast = useAppStore((s) => s.showToast)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const [newName, setNewName] = useState('')

  const filtered = subjects.filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery))

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    try {
      const sub = await api.createSubject(newName)
      setSubjects([...subjects, sub])
      setNewName('')
      showToast('Mapel ditambahkan')
    } catch (err: any) { showToast(err.message, true) }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteSubject(id)
      setSubjects(subjects.filter(s => s.id !== id))
      showToast('Mapel dihapus')
    } catch (err: any) { showToast(err.message, true) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style={{ maxWidth: 400 }}>
      <div className="modal-header">
        <h2 className="modal-title">Atur Mata Pelajaran</h2>
        <button type="button" className="btn-close" onClick={onClose}><span className="material-symbols-outlined">close</span></button>
      </div>
      <div className="modal-body">
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="text" required placeholder="Nama Mapel Baru" style={{ flex: 1 }} value={newName} onChange={e => setNewName(e.target.value)} />
          <button type="submit" className="btn btn-primary btn-sm">Tambah</button>
        </form>
        <div className="subject-list">
          {filtered.length === 0 ? (
            <p className="empty-state">Belum ada mapel.</p>
          ) : filtered.map(sub => (
            <div key={sub.id} className="subject-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{sub.name}</span>
              <button className="btn-icon btn-icon-danger btn-sm" onClick={() => handleDelete(sub.id)} title="Hapus">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
