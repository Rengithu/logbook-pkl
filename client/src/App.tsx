import { useEffect, lazy, Suspense } from 'react'
import { useAppStore } from './store/appStore'
import * as api from './api/client'

import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { RightSidebar } from './components/RightSidebar'
const AiChatPanel = lazy(() => import('./components/AiChatPanel').then(module => ({ default: module.AiChatPanel })))
import { Toast } from './components/Toast'
import { ConfirmProvider } from './components/ConfirmModal'

import { DashboardPage } from './features/dashboard/DashboardPage'
import { EntriesPage } from './features/entries/EntriesPage'
import { AddEntryModal } from './features/entries/AddEntryModal'
import { TasksPage } from './features/tasks/TasksPage'
import { AddTaskModal } from './features/tasks/AddTaskModal'
import { CalendarPage } from './features/calendar/CalendarPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { ManageSubjectsModal } from './features/subjects/ManageSubjectsModal'
import { ToolsPage } from './features/tools/ToolsPage'

function App() {
  const activeTab = useAppStore((s) => s.activeTab)
  const currentView = useAppStore((s) => s.currentView)
  const setTheme = useAppStore((s) => s.setTheme)
  const currentTheme = useAppStore((s) => s.currentTheme)
  const setProfile = useAppStore((s) => s.setProfile)
  const setEntries = useAppStore((s) => s.setEntries)
  const setTasks = useAppStore((s) => s.setTasks)
  const setSubjects = useAppStore((s) => s.setSubjects)
  const setTrashedTasks = useAppStore((s) => s.setTrashedTasks)
  const setTrashedSubjects = useAppStore((s) => s.setTrashedSubjects)
  const setTrashedEntries = useAppStore((s) => s.setTrashedEntries)

  // Initialize app
  useEffect(() => {
    setTheme(currentTheme)

    // Load all data concurrently
    Promise.all([
      api.getProfile().then(setProfile),
      api.getEntries().then(setEntries),
      api.getTasks().then(setTasks),
      api.getSubjects().then(setSubjects),
    ]).catch(err => useAppStore.getState().showToast(err.message, true))

    // Listen for system theme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (useAppStore.getState().currentTheme === 'system') {
        setTheme('system')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [setTheme, currentTheme, setProfile, setEntries, setTasks, setSubjects])

  // Load trash data when switching to trash view
  useEffect(() => {
    if (currentView === 'trash') {
      Promise.all([
        api.getTrashedEntries().then(setTrashedEntries),
        api.getTrashedTasks().then(setTrashedTasks).catch(() => setTrashedTasks([])),
        api.getTrashedSubjects().then(setTrashedSubjects).catch(() => setTrashedSubjects([])),
      ]).catch(() => { })
    } else {
      api.getEntries().then(setEntries).catch(() => { })
    }
  }, [currentView, setEntries, setTrashedEntries, setTrashedTasks, setTrashedSubjects])

  function renderActiveTab() {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage />
      case 'tools': return <ToolsPage />
      case 'entries': return <EntriesPage />
      case 'tasks': return <TasksPage />
      case 'calendar': return <CalendarPage />
      case 'settings': return <SettingsPage />
      default: return <DashboardPage />
    }
  }

  return (
    <>
      <Header />
      <div className="app-layout">
        <Sidebar />
        <main className="app-main-content">
          {renderActiveTab()}
        </main>
        <Suspense fallback={null}>
          <AiChatPanel />
        </Suspense>
        <RightSidebar />
      </div>

      {/* Modals */}
      <AddEntryModal />
      <AddTaskModal />
      <ManageSubjectsModal />
      <ConfirmProvider />
      <Toast />
    </>
  )
}

export default App
