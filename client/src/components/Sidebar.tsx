import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/appStore'

const navGroups = [
  [
    { tab: 'dashboard', icon: 'dashboard', label: 'Beranda' },
    { tab: 'tools', icon: 'handyman', label: 'Alat & Utilitas' },
  ],
  [
    { tab: 'entries', icon: 'calendar_month', label: 'Catatan Harian', view: 'active' as const },
    { tab: 'calendar', icon: 'event', label: 'Kalender' },
    { tab: 'tasks', icon: 'assignment', label: 'Manajemen Tugas', view: 'active' as const },
  ],
  [
    { tab: 'entries', icon: 'delete', label: 'Tempat Sampah', view: 'trash' as const, id: 'trash' },
    { tab: 'settings', icon: 'settings', label: 'Pengaturan', view: 'active' as const },
  ],
]

export function Sidebar() {
  const activeTab = useAppStore((s) => s.activeTab)
  const currentView = useAppStore((s) => s.currentView)
  const setActiveTab = useAppStore((s) => s.setActiveTab)
  const setCurrentView = useAppStore((s) => s.setCurrentView)
  const entries = useAppStore((s) => s.entries)
  const tasks = useAppStore((s) => s.tasks)
  const toolsHasFiles = useAppStore((s) => s.toolsHasFiles)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [pendingNav, setPendingNav] = useState<typeof navGroups[0][0] | null>(null)

  // Summary widget
  const totalEntries = entries.length
  const pendingTasks = tasks.filter(t => t.status !== 'done').length

  const isActive = (item: typeof navGroups[0][0]) => {
    if ('id' in item && item.id === 'trash') {
      return activeTab === 'entries' && currentView === 'trash'
    }
    if (item.tab === 'entries' && currentView === 'trash') return false
    return activeTab === item.tab && (currentView !== 'trash' || item.tab !== 'entries')
  }

  function updateIndicator() {
    const indicator = indicatorRef.current
    const nav = navRef.current
    const activeItem = nav?.querySelector('.nav-item.active') as HTMLElement | null
    if (indicator && activeItem && nav) {
      const navRect = nav.getBoundingClientRect()
      const activeRect = activeItem.getBoundingClientRect()
      const offsetTop = activeRect.top - navRect.top
      indicator.style.opacity = '1'
      indicator.style.height = `${activeRect.height}px`
      indicator.style.transform = `translateY(${offsetTop}px)`
    }
  }

  useEffect(() => {
    updateIndicator()
  })

  function navigateTo(item: typeof navGroups[0][0]) {
    setActiveTab(item.tab)
    if ('view' in item && item.view) {
      setCurrentView(item.view)
    } else if (item.tab !== 'entries') {
      setCurrentView('active')
    }
  }

  function handleClick(item: typeof navGroups[0][0]) {
    // If currently on tools page with uploaded files, show confirmation
    if (activeTab === 'tools' && toolsHasFiles && item.tab !== 'tools') {
      setPendingNav(item)
      return
    }
    navigateTo(item)
  }

  function confirmLeave() {
    if (pendingNav) {
      navigateTo(pendingNav)
      setPendingNav(null)
    }
  }

  function cancelLeave() {
    setPendingNav(null)
  }

  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav" ref={navRef} style={{ position: 'relative' }}>
        <div className="nav-active-indicator" ref={indicatorRef} />
        {navGroups.map((group, gi) => (
          <div className="nav-group" key={gi}>
            {group.map((item, ii) => (
              <button
                key={`${gi}-${ii}`}
                className={`nav-item ${isActive(item) ? 'active' : ''}`}
                onClick={() => handleClick(item)}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}

        {/* Summary Widget */}
        <div className="nav-group widget-dropdown" style={{ marginTop: 16 }}>
          <div
            className="nav-item-static"
            onClick={() => setIsSummaryOpen(!isSummaryOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', color: 'var(--fg-secondary)', cursor: 'pointer', listStyle: 'none', userSelect: 'none' }}
          >
            <span className="material-symbols-outlined">donut_small</span>
            <span style={{ fontWeight: 500, fontSize: 14, flexGrow: 1 }}>Ringkasan</span>
            <span className="material-symbols-outlined expand-icon" style={{ fontSize: 20, transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: isSummaryOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              expand_more
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateRows: isSummaryOpen ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ overflow: 'hidden' }}>
              <div className="sidebar-widget-content" style={{ padding: '4px 16px', paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-base)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Total Catatan</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-primary)' }}>{totalEntries}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-base)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Tugas Tertunda</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)' }}>{pendingTasks}</span>
                </div>
                <button className="btn-outline-primary widget-btn" onClick={() => { setActiveTab('tasks'); setCurrentView('active') }} style={{ width: '100%', borderRadius: 999, padding: '8px 16px', borderColor: 'var(--border)', fontWeight: 500, marginTop: 4 }}>
                  Buka Tugas
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Confirmation Popup */}
      {pendingNav && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            animation: 'popoverFadeIn 0.15s ease'
          }}
          onClick={cancelLeave}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 16,
              width: 'min(380px, 90vw)',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              animation: 'modalZoomIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Popup Body */}
            <div style={{ padding: '28px 24px 20px', textAlign: 'center' }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>warning</span>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: 'var(--fg-heading)' }}>
                Tinggalkan Halaman?
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
                Anda memiliki foto yang sudah diunggah di halaman ini. Jika Anda pindah sekarang, semua foto yang diupload akan hilang.
              </p>
            </div>

            {/* Flush Bottom Buttons (like the reference screenshot) */}
            <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={cancelLeave}
                style={{
                  flex: 1,
                  padding: '14px',
                  border: 'none',
                  borderRight: '1px solid var(--border)',
                  background: 'var(--danger)',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  borderBottomLeftRadius: 16,
                  transition: 'filter 0.15s'
                }}
              >
                Kembali
              </button>
              <button
                onClick={confirmLeave}
                style={{
                  flex: 1,
                  padding: '14px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'var(--primary-fg)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  borderBottomRightRadius: 16,
                  transition: 'filter 0.15s'
                }}
              >
                Ya, Tinggalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
