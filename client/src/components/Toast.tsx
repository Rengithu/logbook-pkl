import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'

export function Toast() {
  const toast = useAppStore((s) => s.toast)
  const hideToast = useAppStore((s) => s.hideToast)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (toast) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      const duration = toast.action ? 6000 : 3000
      timeoutRef.current = window.setTimeout(() => hideToast(), duration)
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [toast, hideToast])

  if (!toast) return null

  return (
    <div key={toast.id} className={`toast show ${toast.isError ? 'error' : ''}`}>
      <span>{toast.message}</span>
      {toast.action && (
        <button
          className="toast-action"
          onClick={() => {
            hideToast()
            toast.action!.onClick()
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  )
}
