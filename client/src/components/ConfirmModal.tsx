import { useState, useEffect } from 'react'

interface ConfirmModalProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ message, onConfirm, onCancel }: ConfirmModalProps) {
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

// Hook for imperative confirm dialog usage
let confirmResolve: ((value: boolean) => void) | null = null
let setConfirmMessage: ((msg: string | null) => void) | null = null

export function useConfirm() {
  return async (message: string): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      confirmResolve = resolve
      setConfirmMessage?.(message)
    })
  }
}

export function ConfirmProvider() {
  const [message, setMessage] = useState<string | null>(null)
  
  useEffect(() => {
    setConfirmMessage = setMessage
  }, [])

  if (!message) return null

  return (
    <ConfirmModal
      message={message}
      onConfirm={() => {
        confirmResolve?.(true)
        setMessage(null)
      }}
      onCancel={() => {
        confirmResolve?.(false)
        setMessage(null)
      }}
    />
  )
}
