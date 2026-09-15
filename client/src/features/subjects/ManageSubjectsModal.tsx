import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { ConfirmModal } from '../../components/ConfirmModal'
import { useAppStore } from '../../store/appStore'
import * as api from '../../api/client'

export function ManageSubjectsModal() {
  const isOpen = useAppStore((s) => s.isManageSubjectsModalOpen)
  const onClose = useAppStore((s) => s.closeManageSubjectsModal)
  const subjects = useAppStore((s) => s.subjects)
  const setSubjects = useAppStore((s) => s.setSubjects)
  const showToast = useAppStore((s) => s.showToast)
  const [newName, setNewName] = useState('')
  // Konfirmasi hapus — memakai komponen ConfirmModal yang sudah ada (juga dipakai AiChatPanel)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  // Rename inline — pola serupa edit-in-place di AiChatPanel (startEdit/cancelEdit/saveEdit)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const filtered = subjects

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    try {
      const sub = await api.createSubject(newName)
      setSubjects([...subjects, sub])
      setNewName('')
      showToast('Mapel ditambahkan')
    } catch (err: any) { showToast(err.message, true) }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return
    try {
      const result = await api.deleteSubject(deleteTarget.id)
      setSubjects(subjects.filter(s => s.id !== deleteTarget.id))
      showToast('Mapel dihapus')
      // Peringatan (bukan blocker): task lama masih menyimpan nama mapel yang sudah dihapus
      if (result?.affectedTasksCount > 0) {
        showToast(`${result.affectedTasksCount} tugas masih mereferensikan mapel "${deleteTarget.name}" yang sudah dihapus`, true)
      }
    } catch (err: any) { showToast(err.message, true) }
    finally { setDeleteTarget(null) }
  }

  function startRename(sub: { id: string; name: string }) {
    setRenamingId(sub.id)
    setRenameValue(sub.name)
  }

  function cancelRename() {
    setRenamingId(null)
    setRenameValue('')
  }

  async function handleRenameSave(id: string) {
    const name = renameValue.trim()
    if (!name) {
      showToast('Nama mapel tidak boleh kosong', true)
      return
    }
    try {
      const updated = await api.updateSubject(id, name)
      setSubjects(subjects.map(s => s.id === id ? updated : s))
      showToast('Mapel diperbarui')
      cancelRename()
    } catch (err: any) { showToast(err.message, true) }
  }

  // Tutup modal = bersihkan state konfirmasi & rename agar tidak "nyangkut" saat dibuka lagi
  function handleClose() {
    setDeleteTarget(null)
    cancelRename()
    onClose()
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} style={{ maxWidth: 400 }}>
      <div className="modal-header">
        <h2 className="modal-title">Atur Mata Pelajaran</h2>
        <button type="button" className="btn-close" onClick={handleClose}><span className="material-symbols-outlined">close</span></button>
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
              {renamingId === sub.id ? (
                <>
                  <input
                    type="text"
                    autoFocus
                    style={{ flex: 1, marginRight: 8, minWidth: 0 }}
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleRenameSave(sub.id)
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        e.stopPropagation()
                        cancelRename()
                      }
                    }}
                  />
                  <button type="button" className="btn-icon btn-sm" onClick={() => handleRenameSave(sub.id)} title="Simpan Nama Baru">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                  </button>
                  <button type="button" className="btn-icon btn-sm" onClick={cancelRename} title="Batalkan">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  </button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{sub.name}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" className="btn-icon btn-sm" onClick={() => startRename(sub)} title="Ganti Nama">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    </button>
                    <button type="button" className="btn-icon btn-icon-danger btn-sm" onClick={() => setDeleteTarget({ id: sub.id, name: sub.name })} title="Hapus">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      </Modal>

      {deleteTarget && (
        <ConfirmModal
          message={`Hapus mapel "${deleteTarget.name}"? Tindakan ini permanen dan tidak bisa dibatalkan.`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
