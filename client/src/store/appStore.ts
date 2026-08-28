import { create } from 'zustand'

import type { Task, Entry, Subject, Profile } from '../types/index'

interface AppState {
    // data, persis seperti state.js
    entries: Entry[]
    trashedEntries: Entry[]
    tasks: Task[]
    subjects: Subject[]
    trashedTasks: Task[]
    trashedSubjects: Subject[]
    profile: Profile | null
    editingId: string | null
    editingTask: Task | null
    searchQuery: string
    taskSort: string
    taskFilter: string
    currentTheme: 'light' | 'dark' | 'system'

    // UI state
    activeTab: string
    currentView: string
    toast: { id: number; message: string; isError?: boolean; action?: { label: string; onClick: () => void } } | null
    isAddEntryModalOpen: boolean
    isAddTaskModalOpen: boolean
    isManageSubjectsModalOpen: boolean
    isProfilePopoverOpen: boolean
    isAiChatOpen: boolean
    isAiChatExpanded: boolean
    entriesViewMode: 'list' | 'grid'
    selectedEntries: string[]
    dashSubjectFilter: string
    toolsHasFiles: boolean

    // actions — cara mengubah data di atas
    setEntries: (entries: Entry[]) => void
    setTrashedEntries: (entries: Entry[]) => void
    setTasks: (tasks: Task[]) => void
    setSubjects: (subjects: Subject[]) => void
    setTrashedTasks: (tasks: Task[]) => void
    setTrashedSubjects: (subjects: Subject[]) => void
    setProfile: (profile: Profile) => void
    setEditingId: (id: string | null) => void
    setSearchQuery: (query: string) => void
    setTaskSort: (sort: string) => void
    setTaskFilter: (filter: string) => void
    setDashSubjectFilter: (filter: string) => void
    setTheme: (theme: 'light' | 'dark' | 'system') => void
    
    // UI actions
    setActiveTab: (tab: string) => void
    setCurrentView: (view: string) => void
    showToast: (message: string, isError?: boolean, action?: { label: string; onClick: () => void }) => void
    hideToast: () => void
    openAddEntryModal: () => void
    closeAddEntryModal: () => void
    openAddTaskModal: (task?: Task) => void
    closeAddTaskModal: () => void
    openManageSubjectsModal: () => void
    closeManageSubjectsModal: () => void
    toggleProfilePopover: () => void
    closeProfilePopover: () => void
    toggleAiChat: () => void
    toggleAiChatExpanded: () => void
    setEntriesViewMode: (mode: 'list' | 'grid') => void
    toggleSelectedEntry: (id: string) => void
    clearSelectedEntries: () => void
    selectAllWeekEntries: (ids: string[]) => void
    setToolsHasFiles: (has: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
    // nilai awal
    entries: [],
    trashedEntries: [],
    tasks: [],
    subjects: [],
    trashedTasks: [],
    trashedSubjects: [],
    profile: null,
    editingId: null,
    editingTask: null,
    searchQuery: '',
    taskSort: 'date_asc',
    taskFilter: 'all',
    dashSubjectFilter: 'all',
    currentTheme: (localStorage.getItem('pkl_theme') as 'light' | 'dark' | 'system') || 'system',
    activeTab: 'dashboard',
    currentView: 'default',
    toast: null,
    isAddEntryModalOpen: false,
    isAddTaskModalOpen: false,
    isManageSubjectsModalOpen: false,
    isProfilePopoverOpen: false,
    isAiChatOpen: false,
    isAiChatExpanded: false,
    entriesViewMode: 'list',
    selectedEntries: [],
    toolsHasFiles: false,

    // actions
    setEntries: (entries) => set({ entries }),
    setTrashedEntries: (trashedEntries) => set({ trashedEntries }),
    setTasks: (tasks) => set({ tasks }),
    setSubjects: (subjects) => set({ subjects }),
    setTrashedTasks: (trashedTasks) => set({ trashedTasks }),
    setTrashedSubjects: (trashedSubjects) => set({ trashedSubjects }),
    setProfile: (profile) => set({ profile }),
    setEditingId: (editingId) => set({ editingId }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setTaskSort: (taskSort) => set({ taskSort }),
    setTaskFilter: (taskFilter) => set({ taskFilter }),
    setDashSubjectFilter: (dashSubjectFilter) => set({ dashSubjectFilter }),
    setTheme: (currentTheme) => {
        localStorage.setItem('pkl_theme', currentTheme)
        let actualTheme: 'light' | 'dark' = currentTheme === 'dark' ? 'dark' : 'light'
        if (currentTheme === 'system') {
            const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
            actualTheme = prefersDark ? 'dark' : 'light'
        }
        document.documentElement.setAttribute('data-theme', actualTheme)
        set({ currentTheme })
    },
    
    // UI actions
    setActiveTab: (activeTab) => set({ activeTab }),
    setCurrentView: (currentView) => set({ currentView }),
    showToast: (message, isError, action) => set({ toast: { id: Date.now(), message, isError, action } }),
    hideToast: () => set({ toast: null }),
    openAddEntryModal: () => set({ isAddEntryModalOpen: true }),
    closeAddEntryModal: () => set({ isAddEntryModalOpen: false, editingId: null }),
    openAddTaskModal: (task) => set({ isAddTaskModalOpen: true, editingTask: task || null }),
    closeAddTaskModal: () => set({ isAddTaskModalOpen: false, editingTask: null }),
    openManageSubjectsModal: () => set({ isManageSubjectsModalOpen: true }),
    closeManageSubjectsModal: () => set({ isManageSubjectsModalOpen: false }),
    toggleProfilePopover: () => set((state) => ({ isProfilePopoverOpen: !state.isProfilePopoverOpen })),
    closeProfilePopover: () => set({ isProfilePopoverOpen: false }),
    toggleAiChat: () => set(state => ({ isAiChatOpen: !state.isAiChatOpen })),
    toggleAiChatExpanded: () => set(state => ({ isAiChatExpanded: !state.isAiChatExpanded })),
    setEntriesViewMode: (entriesViewMode) => set({ entriesViewMode }),
    toggleSelectedEntry: (id) => set((state) => ({
        selectedEntries: state.selectedEntries.includes(id) 
            ? state.selectedEntries.filter(e => e !== id)
            : [...state.selectedEntries, id]
    })),
    clearSelectedEntries: () => set({ selectedEntries: [] }),
    setToolsHasFiles: (toolsHasFiles) => set({ toolsHasFiles }),
    selectAllWeekEntries: (ids) => set((state) => {
        const current = new Set(state.selectedEntries)
        const allSelected = ids.every(id => current.has(id))
        if (allSelected) {
            return { selectedEntries: state.selectedEntries.filter(e => !ids.includes(e)) }
        } else {
            ids.forEach(id => current.add(id))
            return { selectedEntries: Array.from(current) }
        }
    }),
}))