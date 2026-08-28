import { useState } from 'react'
import { useAppStore } from '../../store/appStore'
import { getHoliday } from '../../utils/holidays'

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export function CalendarPage() {
  const tasks = useAppStore((s) => s.tasks)
  const entries = useAppStore((s) => s.entries)
  const [viewDate, setViewDate] = useState(new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDay = firstDay === 0 ? 6 : firstDay - 1

  const today = new Date()

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1))
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1))
  }
  function goToday() {
    setViewDate(new Date())
  }

  // Build calendar cells
  const cells: React.ReactNode[] = []

  // Empty cells
  for (let i = 0; i < startDay; i++) {
    cells.push(<div key={`empty-${i}`} style={{ background: 'var(--bg-elevated)' }} />)
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const isToday = year === today.getFullYear() && month === today.getMonth() && i === today.getDate()
    const dayEntries = entries.filter(e => e.tanggal === dateStr)
    const dayOfWeek = new Date(year, month, i).getDay()
    const hol = getHoliday(dateStr)
    const isHoliday = dayOfWeek === 0 || dayOfWeek === 6 || !!hol
    const dayTasks = tasks.filter(t => t.deadline === dateStr)

    let taskColor = 'var(--success)'
    if (dayTasks.length > 0) {
      const hasOverdue = dayTasks.some(t => t.deadline && new Date(t.deadline) < today && t.status !== 'done')
      const hasTodo = dayTasks.some(t => t.status !== 'done')
      if (hasOverdue) taskColor = 'var(--danger)'
      else if (hasTodo) taskColor = 'var(--warning)'
    }

    cells.push(
      <div key={i} className="calendar-cell" style={{ background: 'var(--bg-surface)', padding: 8, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', minHeight: 0 }}>
        <div className="calendar-cell-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap', gap: 2 }}>
          <div className="calendar-cell-badges" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {isToday ? (
              <span style={{ background: 'var(--primary)', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13 }} title={`Hari Ini${dayEntries.length > 0 ? ` (${dayEntries.length} Jurnal)` : ''}`}>{i}</span>
            ) : dayEntries.length > 0 ? (
              <span style={{ background: 'var(--primary-badge)', color: 'var(--primary)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }} title={`${dayEntries.length} Jurnal`}>{i}</span>
            ) : (
              <span style={{ fontWeight: 500, fontSize: 14, color: isHoliday ? 'var(--danger)' : 'var(--fg-secondary)', paddingLeft: 4, width: 24, height: 24, display: 'flex', alignItems: 'center' }}>{i}</span>
            )}
            
            {dayTasks.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 12, cursor: 'help' }} title={dayTasks.map(t => `• ${t.title}`).join('\n')}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: taskColor }}>assignment</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: taskColor }}>{dayTasks.length}</span>
              </div>
            )}
          </div>
          {hol && (
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--danger)' }} title={hol.name}>celebration</span>
          )}
        </div>
      </div>
    )
  }

  // Fill the grid to always have exactly 42 cells (6 rows) to keep UI consistent across months
  const remainingCells = 42 - cells.length
  for (let i = 0; i < remainingCells; i++) {
    cells.push(<div key={`empty-end-${i}`} style={{ background: 'var(--bg-elevated)' }} />)
  }

  return (
    <section id="tab-calendar" className="tab-panel active">
      <div style={{ padding: '16px 32px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="page-title">Kalender PKL</h2>
            <p className="hint" style={{ margin: 0 }}>Tinjauan seluruh jadwal kegiatan dan tugasmu.</p>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--fg-primary)', whiteSpace: 'nowrap', minWidth: 140 }}>{MONTH_NAMES[month]} {year}</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="btn btn-outline" onClick={goToday}>Hari Ini</button>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-ghost" onClick={prevMonth}><span className="material-symbols-outlined">chevron_left</span></button>
                <button className="btn btn-ghost" onClick={nextMonth}><span className="material-symbols-outlined">chevron_right</span></button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 500, fontSize: 14, padding: '12px 0', borderBottom: '1px solid var(--border)', color: 'var(--fg-secondary)' }}>
            <div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div><div>Min</div>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(0, 1fr)', gap: 1, background: 'var(--border)' }}>
            {cells}
          </div>
        </div>
      </div>
    </section>
  )
}
