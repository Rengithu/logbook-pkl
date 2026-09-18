import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'

type ToastData = {
  id: number
  message: string
  isError?: boolean
  action?: { label: string; onClick: () => void }
}

// Satu toast dengan timer independen — toast lain tidak ikut ter-reset
function ToastItem({ toast }: { toast: ToastData }) {
  const hideToast = useAppStore((s) => s.hideToast)

  useEffect(() => {
    const duration = toast.isError ? 7000 : toast.action ? 6000 : 3000
    const timer = window.setTimeout(() => hideToast(toast.id), duration)
    return () => window.clearTimeout(timer)
  }, [toast, hideToast])

  return (
    <div role="status" aria-live="polite" className={`toast show ${toast.isError ? 'error' : ''}`}>
      <span>{toast.message}</span>
      {toast.action && (
        <button
          className="toast-action"
          onClick={() => {
            hideToast(toast.id)
            toast.action!.onClick()
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        className="toast-close"
        onClick={() => hideToast(toast.id)}
        title="Tutup"
        aria-label="Tutup notifikasi"
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, marginLeft: 10 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
      </button>
    </div>
  )
}

export function Toast() {
  const toasts = useAppStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
