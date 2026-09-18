import { useRef, useEffect, type ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selector =
    'input:not([disabled]), button:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(root.querySelectorAll<HTMLElement>(selector))
}

export function Modal({ isOpen, onClose, children, className = '', style }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  // Fokus masuk/keluar modal — deps sengaja hanya [isOpen] agar pemanggil yang
  // membuat onClose baru setiap render tidak memicu refocus saat user mengetik.
  useEffect(() => {
    if (!isOpen) return
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null

    const modal = modalRef.current
    if (modal) {
      const focusables = getFocusableElements(modal)
      if (focusables.length > 0) focusables[0].focus()
      else modal.focus()
    }

    return () => {
      // Kembalikan fokus ke elemen yang ada sebelum modal dibuka
      previouslyFocusedRef.current?.focus?.()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Focus trap sederhana: Tab/Shift+Tab berputar di dalam modal
      if (e.key === 'Tab') {
        const modal = modalRef.current
        if (!modal) return
        const focusables = getFocusableElements(modal)
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement
        if (e.shiftKey) {
          if (active === first || !modal.contains(active)) {
            e.preventDefault()
            last.focus()
          }
        } else if (active === last || !modal.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`modal ${className}`}
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
