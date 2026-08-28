import { useState, useEffect, useRef } from 'react'

interface CustomDropdownProps {
  value: string
  onChange: (val: string) => void
  options: { value: string, label: string }[]
  placeholder?: string
}

export function CustomDropdown({ value, onChange, options, placeholder = 'Pilih opsi...' }: CustomDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div 
        className={`custom-dropdown-trigger ${open ? 'open' : ''}`}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'var(--bg-surface)' }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ color: value ? 'var(--fg-primary)' : 'var(--fg-muted)' }}>
          {options.find(o => o.value === value)?.label || placeholder}
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--fg-tertiary)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          expand_more
        </span>
      </div>
      
      <div 
        className={`custom-dropdown-menu ${open ? 'open' : ''}`}
        style={{
          position: 'absolute', top: '100%', left: 0, right: 0, 
          background: 'var(--bg-base)', border: '1px solid var(--primary)', borderTop: 'none',
          borderRadius: '0 0 16px 16px', zIndex: 13, overflow: 'hidden', 
          boxShadow: '0 12px 24px rgba(0,0,0,0.2)'
        }}>
        {options.map(o => (
          <div 
            key={o.value} 
            style={{ 
              padding: '12px 16px', cursor: 'pointer', transition: 'background 0.2s',
              background: value === o.value ? 'var(--bg-surface-hover)' : 'transparent',
              fontWeight: value === o.value ? 600 : 400,
              color: value === o.value ? 'var(--primary)' : 'var(--fg-primary)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = value === o.value ? 'var(--bg-surface-hover)' : 'transparent'}
            onClick={() => { onChange(o.value); setOpen(false) }}
          >
            {o.label}
          </div>
        ))}
      </div>
    </div>
  )
}
