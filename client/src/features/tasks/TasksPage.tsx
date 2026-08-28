import { useAppStore } from '../../store/appStore'
import { formatTanggalIndo } from '../../utils/format'
import * as api from '../../api/client'

const COLORS = ['#e91e63', '#9c27b0', '#3f51b5', '#009688', '#ff9800', '#795548', '#607d8b', '#f44336']
const STATUS_ORDER: Record<string, number> = { 'todo': 1, 'in_progress': 2, 'done': 3 }

export function TasksPage() {
  const tasks = useAppStore((s) => s.tasks)
  const setTasks = useAppStore((s) => s.setTasks)
  const searchQuery = useAppStore((s) => s.searchQuery)
  const taskSort = useAppStore((s) => s.taskSort)
  const setTaskSort = useAppStore((s) => s.setTaskSort)
  const taskFilter = useAppStore((s) => s.taskFilter)
  const setTaskFilter = useAppStore((s) => s.setTaskFilter)
  const openAddTaskModal = useAppStore((s) => s.openAddTaskModal)
  const showToast = useAppStore((s) => s.showToast)

  // Filter
  let filteredTasks = [...tasks]
  if (taskFilter !== 'all') {
    if (taskFilter === 'status_todo') filteredTasks = filteredTasks.filter(t => t.status === 'todo')
    else if (taskFilter === 'status_in_progress') filteredTasks = filteredTasks.filter(t => t.status === 'in_progress')
    else if (taskFilter === 'status_done') filteredTasks = filteredTasks.filter(t => t.status === 'done')
  }
  if (searchQuery) {
    filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(searchQuery))
  }

  // Sort
  filteredTasks.sort((a, b) => {
    switch (taskSort) {
      case 'title_asc': return a.title.localeCompare(b.title)
      case 'title_desc': return b.title.localeCompare(a.title)
      case 'date_asc':
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      case 'status_asc':
        return (STATUS_ORDER[a.status] || 0) - (STATUS_ORDER[b.status] || 0)
      default: return 0
    }
  })

  async function handleStatusToggle(task: typeof tasks[0]) {
    let nextStatus = 'todo'
    if (task.status === 'todo') nextStatus = 'in_progress'
    else if (task.status === 'in_progress') nextStatus = 'done'
    try {
      const updated = await api.updateTask(task.id, { status: nextStatus })
      setTasks(tasks.map(t => t.id === task.id ? updated : t))
    } catch (e: any) { showToast(e.message, true) }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteTask(id)
      setTasks(tasks.filter(t => t.id !== id))
      showToast('Tugas dipindahkan ke Tempat Sampah', false, {
        label: 'Urungkan',
        onClick: async () => {
          try {
            await api.restoreTask(id)
            const freshTasks = await api.getTasks()
            setTasks(freshTasks)
            showToast('Penghapusan tugas dibatalkan')
          } catch (e: any) { showToast(e.message, true) }
        }
      })
    } catch (e: any) { showToast(e.message, true) }
  }

  return (
    <section id="tab-tasks" className="tab-panel active">
      <div style={{ padding: '16px 32px', width: '100%' }}>
        <div className="page-header">
          <div>
            <h2 className="page-title">Papan Manajemen Tugas</h2>
            <p className="hint" style={{ margin: 0 }}>Catat dan pantau seluruh tugas dari sekolahmu di sini.</p>
          </div>
        </div>

        {/* Column Headers */}
        <div className="list-view-header">
          <div className="list-view-columns" style={{ position: 'relative', alignItems: 'center' }}>
            <div className="list-col col-name" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, color: 'var(--fg-primary)', fontSize: 14 }}
              onClick={() => {
                if (taskSort === 'title_asc') setTaskSort('title_desc')
                else if (taskSort === 'title_desc') setTaskSort('')
                else setTaskSort('title_asc')
              }}
            >
              <span>Judul Tugas</span>
              <div className={`sort-indicator ${taskSort.startsWith('title') ? 'active' : ''}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {taskSort === 'title_desc' ? 'arrow_upward' : 'arrow_downward'}
                </span>
              </div>
            </div>
            <div className="list-col col-subject" style={{ fontSize: 14, fontWeight: 500 }}>Mata Pelajaran</div>
            <div className="list-col col-date" style={{ fontSize: 14, fontWeight: 500 }}>Deadline</div>
            <div className="list-col col-status" style={{ fontSize: 14, fontWeight: 500 }}>Status</div>
            <div className="list-col col-action" style={{ width: 'auto', justifyContent: 'flex-end', gap: 8, display: 'flex' }}>
              <FilterDropdown value={taskFilter} onChange={setTaskFilter} />
              <SortDropdown value={taskSort} onChange={setTaskSort} />
            </div>
          </div>
        </div>

        {/* Task Rows */}
        <div className="list-view-container">
          {filteredTasks.length === 0 ? (
            <p className="empty-state">Belum ada tugas.</p>
          ) : (
            filteredTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onEdit={() => openAddTaskModal(task)}
                onDelete={() => handleDelete(task.id)}
                onStatusToggle={() => handleStatusToggle(task)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  )
}

function TaskRow({ task, onEdit, onDelete, onStatusToggle }: {
  task: typeof useAppStore.getState extends () => infer S ? S extends { tasks: (infer T)[] } ? T : never : never
  onEdit: () => void
  onDelete: () => void
  onStatusToggle: () => void
}) {
  const iconLetter = task.subject ? task.subject.charAt(0).toUpperCase() : 'T'
  const iconColor = task.subject ? COLORS[task.subject.length % COLORS.length] : '#83a598'
  const subjectText = task.subject || '-'

  let statusBadge: React.ReactNode
  if (task.status === 'todo') statusBadge = <span className="status-badge status-todo">Belum Mulai</span>
  else if (task.status === 'in_progress') statusBadge = <span className="status-badge status-in-progress">Proses</span>
  else statusBadge = <span className="status-badge status-done">Selesai</span>

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'

  return (
    <div className="task-row">
      <div className="list-col col-name task-title" style={{ minWidth: 0, alignItems: 'flex-start', paddingTop: 12, paddingBottom: 12 }}>
        <div className="task-icon-circle" style={{ background: iconColor, flexShrink: 0, marginTop: 2 }}>{iconLetter}</div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%', gap: 4 }}>
          <span title={task.title} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', width: '100%', fontWeight: 500 }}>{task.title}</span>
          {task.description && <div style={{ fontSize: 12, color: 'var(--fg-muted)', whiteSpace: 'normal', lineHeight: 1.4 }}>{task.description}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {task.referenceUrl && (
              <a href={task.referenceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>link</span>Link
              </a>
            )}
            {task.attachmentPath && (
              <a href={`/uploads/${task.attachmentPath}`} target="_blank" download={task.attachmentName || undefined} style={{ fontSize: 12, color: 'var(--fg-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>attach_file</span>File
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="list-col col-subject task-subject">{subjectText}</div>
      <div className="list-col col-date">
        {task.deadline ? (
          <span className={`task-deadline ${isOverdue ? 'overdue' : ''}`}>{formatTanggalIndo(task.deadline)}</span>
        ) : '-'}
      </div>
      <div className="list-col col-status">{statusBadge}</div>
      <div className="list-col col-action">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn-icon btn-sm" onClick={onEdit} title="Edit Tugas"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span></button>
          <button className="btn-icon btn-icon-danger btn-sm" onClick={onDelete} title="Hapus"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span></button>
          <button className="btn-icon btn-sm" onClick={onStatusToggle} title="Ubah Status"><span className="material-symbols-outlined" style={{ fontSize: 18 }}>sync_alt</span></button>
        </div>
      </div>
    </div>
  )
}

function FilterDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const filters = [
    { value: 'all', label: 'Semua Tugas' },
    { value: 'status_todo', label: 'Belum Mulai' },
    { value: 'status_in_progress', label: 'Proses' },
    { value: 'status_done', label: 'Selesai' },
  ]
  return (
    <div className="custom-select-wrapper" style={{ width: 'auto' }}>
      <button className="btn-icon sort-btn-outline custom-select-trigger" title="Saring Tugas" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', padding: 0, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}
        onClick={(e) => {
          e.stopPropagation()
          const wrapper = (e.target as HTMLElement).closest('.custom-select-wrapper')
          wrapper?.classList.toggle('open')
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>filter_list</span>
      </button>
      <div className="custom-select-dropdown" style={{ top: '100%', right: 0, left: 'auto', minWidth: 200 }}>
        <div className="custom-select-options">
          {filters.map(f => (
            <div key={f.value} className="custom-select-option" style={{ background: value === f.value ? 'var(--bg-elevated)' : 'transparent' }}
              onClick={(e) => {
                e.stopPropagation()
                onChange(f.value)
                ;(e.target as HTMLElement).closest('.custom-select-wrapper')?.classList.remove('open')
              }}
            >
              <div className="option-label">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SortDropdown({ value: _value, onChange }: { value: string; onChange: (v: string) => void }) {
  const sorts = [
    { value: 'title_asc', icon: 'sort_by_alpha', label: 'Nama (A-Z)' },
    { value: 'title_desc', icon: 'sort_by_alpha', label: 'Nama (Z-A)', flip: true },
    { value: 'date_asc', icon: 'event', label: 'Tenggat Terdekat' },
    { value: 'status_asc', icon: 'pending_actions', label: 'Status (Belum Mulai)' },
  ]
  return (
    <div className="custom-select-wrapper" style={{ width: 'auto' }}>
      <button className="btn-icon sort-btn-outline custom-select-trigger" title="Urutkan" style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', padding: 0, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}
        onClick={(e) => {
          e.stopPropagation()
          const wrapper = (e.target as HTMLElement).closest('.custom-select-wrapper')
          wrapper?.classList.toggle('open')
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>sort</span>
      </button>
      <div className="custom-select-dropdown" style={{ top: '100%', right: 0, left: 'auto', minWidth: 200 }}>
        <div className="custom-select-options">
          {sorts.map(s => (
            <div key={s.value} className="custom-select-option"
              onClick={(e) => {
                e.stopPropagation()
                onChange(s.value)
                ;(e.target as HTMLElement).closest('.custom-select-wrapper')?.classList.remove('open')
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, transform: s.flip ? 'scaleY(-1)' : undefined }}>{s.icon}</span>
              <div className="option-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
