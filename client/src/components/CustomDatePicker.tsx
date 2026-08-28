import { useState, useEffect, useRef } from 'react'

interface CustomDatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (val: string) => void
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export function CustomDatePicker({ value, onChange }: CustomDatePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  const initialDate = value ? new Date(value) : new Date()
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth())
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear())

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) } 
    else { setCurrentMonth(m => m - 1) }
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) } 
    else { setCurrentMonth(m => m + 1) }
  }

  const handleSelectDate = (day: number) => {
    const d = new Date(currentYear, currentMonth, day)
    // format YYYY-MM-DD
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    onChange(`${yyyy}-${mm}-${dd}`)
    setOpen(false)
  }

  // Format display date: DD/MM/YYYY
  const displayDate = value ? (() => {
    const [y, m, d] = value.split('-')
    return `${d} / ${m} / ${y}`
  })() : ''

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div 
        className={`custom-dropdown-trigger ${open ? 'open' : ''}`}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: 'var(--bg-surface)' }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ color: value ? 'var(--fg-primary)' : 'var(--fg-muted)' }}>
          {displayDate || 'Pilih Tanggal'}
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--fg-tertiary)' }}>
          calendar_month
        </span>
      </div>
      
      <div 
        className={`custom-dropdown-menu ${open ? 'open' : ''}`}
        style={{
          position: 'absolute', top: '100%', left: 0, right: 0, 
          background: 'var(--bg-elevated)', border: '1px solid var(--primary)', borderTop: 'none',
          borderRadius: '0 0 16px 16px', zIndex: 13, overflow: 'hidden', 
          boxShadow: '0 12px 24px rgba(0,0,0,0.2)', padding: '16px'
        }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button type="button" className="btn-icon" onClick={handlePrevMonth}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div style={{ fontWeight: 600, fontSize: 16 }}>
            {MONTHS[currentMonth]} {currentYear}
          </div>
          <button type="button" className="btn-icon" onClick={handleNextMonth}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {/* Days Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {DAYS.map((d, i) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: i === 0 ? 'var(--danger)' : 'var(--fg-secondary)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: 42 }).map((_, index) => {
            const dayNumber = index - firstDay + 1
            const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth
            
            if (!isCurrentMonth) {
              return <div key={index} style={{ padding: '8px' }} />
            }

            const isSelected = value && 
              parseInt(value.split('-')[2]) === dayNumber && 
              parseInt(value.split('-')[1]) - 1 === currentMonth && 
              parseInt(value.split('-')[0]) === currentYear

            return (
              <div 
                key={index}
                onClick={() => handleSelectDate(dayNumber)}
                style={{
                  padding: '8px 0', textAlign: 'center', cursor: 'pointer',
                  borderRadius: 8, fontSize: 14, fontWeight: isSelected ? 600 : 400,
                  background: isSelected ? 'var(--primary)' : 'transparent',
                  color: isSelected ? '#fff' : (index % 7 === 0 ? 'var(--danger)' : 'var(--fg-primary)'),
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
              >
                {dayNumber}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
