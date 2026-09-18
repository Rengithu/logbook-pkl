import { useEffect } from 'react'

interface ConfirmModalProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
  // Tutup dengan Escape — pola listener sama seperti Modal.tsx
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="modal-overlay open" onClick={onCancel}>
      <div className="modal-card" style={{ maxWidth: 400, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, color: 'var(--fg-heading)' }}>Konfirmasi</h3>
        <p style={{ color: 'var(--fg-secondary)', marginBottom: 24, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn-outline-primary" onClick={onCancel}>Batal</button>
          <button className="btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }} onClick={onConfirm}>Hapus</button>
        </div>
      </div>
    </div>
  )
}
