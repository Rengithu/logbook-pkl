import { useState, useRef, useEffect, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import * as apiClient from '../api/client'

// Referensi mention yang tersimpan dalam sebuah pesan — dipakai untuk kirim taskId
// eksplisit ke backend, supaya AI tidak pernah "menebak" task mana yang dimaksud.
interface MentionRef {
  id: string
  label: string
}

const SUGGESTION_CHIPS = [
  { icon: 'edit_note', label: 'Catat kegiatan', prefill: 'catat: ' },
  { icon: 'add_task', label: 'Tambah task', prefill: 'tambahin task: ' },
  { icon: 'checklist', label: 'Tugas hari ini', prefill: 'tugas apa yang belum selesai?' },
  { icon: 'insights', label: 'Progress minggu ini', prefill: 'progress PKL aku minggu ini gimana?' },
]

export function AiChatPanel() {
  const isAiChatOpen = useAppStore(s => s.isAiChatOpen)
  const isAiChatExpanded = useAppStore(s => s.isAiChatExpanded)
  const toggleAiChat = useAppStore(s => s.toggleAiChat)
  const toggleAiChatExpanded = useAppStore(s => s.toggleAiChatExpanded)
  const profile = useAppStore(s => s.profile)
  const showToast = useAppStore(s => s.showToast)
  const setTasks = useAppStore(s => s.setTasks)
  const tasks = useAppStore(s => s.tasks)

  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, actionTaken?: any, mentions?: MentionRef[] }[]>([
    { role: 'assistant', content: 'Halo! Ada yang bisa saya bantu terkait PKL atau tugas hari ini?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // --- Mention (@) state ---
  const [mentionQuery, setMentionQuery] = useState<string | null>(null) // null = dropdown tertutup
  const [activeMentions, setActiveMentions] = useState<MentionRef[]>([]) // mention yang sudah dipilih di pesan yang sedang diketik
  const [mentionHighlight, setMentionHighlight] = useState(0)

  // --- Edit pesan state ---
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')

  const mentionCandidates = useMemo(() => {
    const list = tasks.filter(t => t.status !== 'done')
    if (!mentionQuery) return list.slice(0, 8)
    const q = mentionQuery.toLowerCase()
    return list.filter(t => t.title.toLowerCase().includes(q)).slice(0, 8)
  }, [tasks, mentionQuery])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Muat daftar task saat panel dibuka, supaya dropdown mention selalu punya data terbaru
  useEffect(() => {
    if (isAiChatOpen) {
      apiClient.getTasks().then(setTasks).catch(() => {/* biarkan, tidak kritis */})
    }
  }, [isAiChatOpen])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setInput(value)

    // Deteksi apakah user sedang mengetik mention: cari "@" terakhir sebelum cursor,
    // tanpa spasi di antaranya.
    const cursorPos = e.target.selectionStart ?? value.length
    const textBeforeCursor = value.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')

    if (atIndex !== -1 && !textBeforeCursor.slice(atIndex + 1).includes(' ')) {
      setMentionQuery(textBeforeCursor.slice(atIndex + 1))
      setMentionHighlight(0)
    } else {
      setMentionQuery(null)
    }
  }

  function selectMention(task: { id: string, title: string }) {
    const cursorPos = inputRef.current?.selectionStart ?? input.length
    const textBeforeCursor = input.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    if (atIndex === -1) return

    const before = input.slice(0, atIndex)
    const after = input.slice(cursorPos)
    const mentionLabel = `@${task.title}`
    setInput(`${before}${mentionLabel} ${after}`)
    setActiveMentions(prev => [...prev, { id: task.id, label: task.title }])
    setMentionQuery(null)

    // fokuskan kembali ke input setelah memilih
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (mentionQuery !== null && mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionHighlight(h => Math.min(h + 1, mentionCandidates.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionHighlight(h => Math.max(h - 1, 0))
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        selectMention(mentionCandidates[mentionHighlight])
        return
      }
      if (e.key === 'Escape') {
        setMentionQuery(null)
        return
      }
    }
  }

  function useSuggestion(prefill: string) {
    setInput(prefill)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  async function sendMessage(text: string, mentions: MentionRef[]) {
    setMessages(prev => [...prev, { role: 'user', content: text, mentions }])
    setIsLoading(true)

    try {
      let reply = 'Maaf, terjadi kesalahan.'
      let actionTaken: any = null

      if (profile?.apiProvider === 'openrouter') {
        if (!profile.openRouterApiKey) throw new Error('API Key OpenRouter belum diatur di Pengaturan.')

        const openRouterUrl = import.meta.env.VITE_OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions'
        const res = await fetch(openRouterUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${profile.openRouterApiKey}`,
            'HTTP-Referer': window.location.href,
            'X-Title': 'Laporan PKL App',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: import.meta.env.VITE_DEFAULT_AI_MODEL || 'qwen2.5-coder:7b',
            messages: [
              { role: 'system', content: 'Anda adalah asisten AI yang membantu siswa dalam kegiatan Praktek Kerja Lapangan (PKL).' },
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: text }
            ]
          })
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error.message || 'Gagal menghubungi OpenRouter')
        reply = data.choices[0].message.content
      }
      else if (profile?.apiProvider === 'ollama') {
        const url = profile.ollamaUrl || 'http://localhost:11434'
        const res = await fetch(`${url}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: import.meta.env.VITE_DEFAULT_AI_MODEL || 'qwen2.5-coder:7b',
            messages: [
              { role: 'system', content: 'Anda adalah asisten AI yang membantu siswa dalam kegiatan Praktek Kerja Lapangan (PKL).' },
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: text }
            ],
            stream: false
          })
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error || 'Gagal menghubungi Ollama')
        reply = data.message.content
      }
      else {
        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text, mentionedTaskIds: mentions.map(m => m.id) })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Gagal menghubungi Gemini')
        reply = data.result
        actionTaken = data.actionTaken
      }

      setMessages(prev => [...prev, { role: 'assistant', content: reply, actionTaken }])

      if (actionTaken?.type === 'create_task' || actionTaken?.type === 'update_task_status') {
        apiClient.getTasks().then(setTasks).catch(console.error)
      } else if (actionTaken?.type === 'create_quick_note') {
        window.dispatchEvent(new CustomEvent('quicknote:created'))
      }
    } catch (err: any) {
      showToast(err.message, true)
      setMessages(prev => [...prev, { role: 'assistant', content: `[Error] ${err.message}` }])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return

    const mentions = activeMentions
    setInput('')
    setActiveMentions([])
    setMentionQuery(null)
    await sendMessage(text, mentions)
  }

  function startEdit(index: number, currentText: string) {
    setEditingIndex(index)
    setEditingText(currentText)
  }

  function cancelEdit() {
    setEditingIndex(null)
    setEditingText('')
  }

  async function saveEdit(index: number) {
    const newText = editingText.trim()
    if (!newText) return

    // Hapus pesan ini dan semua pesan setelahnya, lalu kirim ulang seperti percakapan baru dari titik ini
    const originalMentions = messages[index]?.mentions || []
    setMessages(prev => prev.slice(0, index))
    setEditingIndex(null)
    setEditingText('')
    await sendMessage(newText, originalMentions)
  }

  const isFreshChat = messages.length === 1 && input.trim() === ''

  return (
    <div className={`ai-chat-panel ${isAiChatOpen ? 'open' : ''} ${isAiChatExpanded ? 'expanded' : ''}`}>
      <div className="ai-chat-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--fg-secondary)' }}>
            AI Assistant
          </span>
          <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--fg-primary)' }}>
            Tanya LogBook
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, alignSelf: 'flex-start', margin: '-4px -8px 0 0' }}>
          <button className="btn-icon" onClick={toggleAiChatExpanded} style={{ width: 32, height: 32 }} title={isAiChatExpanded ? "Perkecil" : "Perbesar"}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {isAiChatExpanded ? 'close_fullscreen' : 'open_in_full'}
            </span>
          </button>
          <button className="btn-icon" onClick={toggleAiChat} style={{ width: 32, height: 32 }} title="Tutup">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>
      </div>

      <div className="ai-chat-messages">
        {profile?.apiProvider && profile.apiProvider !== 'gemini' && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '8px 12px', marginBottom: 8,
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 8, fontSize: 12.5, color: 'var(--fg-secondary)', lineHeight: 1.5
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, marginTop: 1 }}>info</span>
            <span>
              Kemampuan menambah/mengubah task lewat chat hanya tersedia dengan provider Gemini.
              Anda sedang menggunakan <b>{profile.apiProvider === 'openrouter' ? 'OpenRouter' : 'Ollama'}</b>.
            </span>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            <div className="chat-bubble" style={{ position: 'relative' }}>
              {m.role === 'assistant' ? (
                <>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {m.content}
                  </ReactMarkdown>

                  {m.actionTaken && m.actionTaken.type === 'create_task' && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: 18, marginTop: 2 }}>check_circle</span>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--fg-primary)' }}>
                        <div>Task baru ditambahkan:</div>
                        <div style={{ fontWeight: 600 }}>{m.actionTaken.data.title}</div>
                      </div>
                    </div>
                  )}
                  {m.actionTaken && m.actionTaken.type === 'create_quick_note' && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: 18, marginTop: 2 }}>check_circle</span>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--fg-primary)' }}>
                        <div>Catatan cepat disimpan:</div>
                        <div style={{ fontWeight: 600 }}>{m.actionTaken.data.teks}</div>
                      </div>
                    </div>
                  )}
                  {m.actionTaken && m.actionTaken.type === 'update_task_status' && (
                    <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: 18, marginTop: 2 }}>check_circle</span>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--fg-primary)' }}>
                        <div>Status task diperbarui:</div>
                        <div style={{ fontWeight: 600 }}>{m.actionTaken.data.title} → {m.actionTaken.data.status}</div>
                      </div>
                    </div>
                  )}
                </>
              ) : editingIndex === i ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text"
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    autoFocus
                    style={{ width: '100%' }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(i)
                      if (e.key === 'Escape') cancelEdit()
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-outline-primary btn-sm" onClick={cancelEdit}>Batal</button>
                    <button type="button" className="btn-primary btn-sm" onClick={() => saveEdit(i)}>Simpan</button>
                  </div>
                </div>
              ) : (
                <>
                  {m.content}
                  <button
                    type="button"
                    className="btn-icon chat-edit-btn"
                    title="Edit pesan"
                    onClick={() => startEdit(i, m.content)}
                    style={{
                      position: 'absolute', top: -10, right: -10, width: 26, height: 26,
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)', opacity: 0
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message assistant">
            <div className="chat-bubble loading">
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isFreshChat && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 12px 8px' }}>
          {SUGGESTION_CHIPS.map(chip => (
            <button
              key={chip.label}
              type="button"
              onClick={() => useSuggestion(chip.prefill)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 10px', borderRadius: 999,
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                color: 'var(--fg-secondary)', fontSize: 12.5, cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{chip.icon}</span>
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <form className="ai-chat-input-area" onSubmit={handleSend} style={{ position: 'relative' }}>
        {mentionQuery !== null && mentionCandidates.length > 0 && (
          <div style={{
            position: 'absolute', bottom: '100%', left: 12, right: 12, marginBottom: 6,
            background: 'var(--bg-elevated, var(--bg-secondary))', border: '1px solid var(--border)',
            borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 20
          }}>
            {mentionCandidates.map((t, idx) => (
              <div
                key={t.id}
                onMouseDown={(e) => { e.preventDefault(); selectMention(t) }}
                style={{
                  padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                  background: idx === mentionHighlight ? 'var(--bg-hover, rgba(255,255,255,0.06))' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--fg-secondary)' }}>task_alt</span>
                {t.title}
              </div>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Tanya sesuatu... (ketik @ untuk referensi task)"
          disabled={isLoading}
        />
        <button type="submit" className="btn-icon" disabled={!input.trim() || isLoading}>
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  )
}