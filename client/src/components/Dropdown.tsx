import { useState, useEffect, useRef, type ReactNode } from 'react'

interface DropdownProps {
  /** Elemen pemicu (mis. tombol ikon) */
  trigger: ReactNode
  /** Isi dropdown. Bisa ReactNode biasa, atau fungsi (close) => ReactNode
   *  agar opsi di dalamnya bisa menutup dropdown setelah dipilih
   *  (dan elemen interaktif seperti search-box tidak menutup saat diklik). */
  children: ReactNode | ((close: () => void) => ReactNode)
  /** Posisi menu relatif trigger */
  align?: 'left' | 'right'
  /** Class tambahan untuk container (mis. 'custom-select-wrapper' agar styling trigger konsisten) */
  wrapperClassName?: string
}

/**
 * Dropdown generik reusable.
 * - Klik di luar menutup dropdown (masalah utama implementasi lama yang manipulasi classList)
 * - Escape menutup dropdown
 * - State buka/tutup dikelola penuh oleh React
 */
export function Dropdown({ trigger, children, align = 'left', wrapperClassName = '' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const close = () => setOpen(false)
  const content = typeof children === 'function' ? children(close) : children
  const wrapperClass = [wrapperClassName, open ? 'open' : ''].filter(Boolean).join(' ')

  return (
    <div ref={ref} className={wrapperClass} style={{ position: 'relative', width: 'auto' }}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div
          className="custom-select-dropdown open"
          style={{ top: '100%', minWidth: 200, ...(align === 'right' ? { right: 0, left: 'auto' } : { left: 0 }) }}
        >
          <div className="custom-select-options">{content}</div>
        </div>
      )}
    </div>
  )
}
