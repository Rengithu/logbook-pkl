import { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import * as apiClient from '../api/client'
import type { QuickNote } from '../types/index'
import { todayStr } from '../utils/format'

export function QuickNoteWidget() {
  const showToast = useAppStore((s) => s.showToast)
  const [inputText, setInputText] = useState('')
  const [notes, setNotes] = useState<QuickNote[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiClient.getQuickNotes(todayStr())
      .then(setNotes)
      .catch(() => {/* silently ignore on load */})
  }, [])

  async function handleSave() {
    if (!inputText.trim()) return
    setSaving(true)
    try {
      const newNote = await apiClient.createQuickNote({ tanggal: todayStr(), teks: inputText.trim() })
      setNotes(prev => [...prev, newNote])
      setInputText('')
    } catch (e: any) {
      showToast(e.message, true)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiClient.deleteQuickNote(id)
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch (e: any) {
      showToast(e.message, true)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div className="quick-note-widget">
      <div className="quick-note-header">
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent-yellow)' }}>
          bolt
        </span>
        <h3 className="quick-note-title">Catatan Cepat Hari Ini</h3>
        {notes.length > 0 && (
          <span className="quick-note-badge">{notes.length}</span>
        )}
      </div>

      <div className="quick-note-input-row">
        <input
          id="quick-note-input"
          type="text"
          className="quick-note-input"
          placeholder="Tulis kegiatan singkat, tekan Enter atau klik Simpan..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={saving}
          autoComplete="off"
        />
        <button
          id="quick-note-save-btn"
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={saving || !inputText.trim()}
          style={{ flexShrink: 0, gap: 6 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
        </button>
      </div>

      {notes.length > 0 ? (
        <ul className="quick-note-list">
          {notes.map(note => (
            <li key={note.id} className="quick-note-item">
              <span className="material-symbols-outlined quick-note-item-dot" style={{ fontSize: 14 }}>
                fiber_manual_record
              </span>
              <span className="quick-note-item-text">{note.teks}</span>
              <button
                type="button"
                className="btn-icon quick-note-delete-btn"
                title="Hapus catatan ini"
                onClick={() => handleDelete(note.id)}
                style={{ flexShrink: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint quick-note-empty">
          Belum ada catatan untuk hari ini. Catat kegiatan kecil sekarang, lalu gunakan AI untuk merangkumnya saat membuat jurnal.
        </p>
      )}
    </div>
  )
}
