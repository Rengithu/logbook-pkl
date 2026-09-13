import { useState, useRef, useEffect, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import * as apiClient from '../api/client'
import { ConfirmModal } from './ConfirmModal'

interface MentionRef {
  id: string
  label: string
}

interface PastedChip {
  id: string
  text: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  actionTaken?: any
  mentions?: MentionRef[]
  pastedChips?: PastedChip[]
}

const SUGGESTION_CHIPS = [
  { icon: 'edit_note', label: 'Catat kegiatan', prefill: 'catat: ' },
  { icon: 'add_task', label: 'Tambah task', prefill: 'tambahin task: ' },
  { icon: 'checklist', label: 'Tugas hari ini', prefill: 'tugas apa yang belum selesai?' },
  { icon: 'insights', label: 'Progress minggu ini', prefill: 'progress PKL aku minggu ini gimana?' },
]

const PASTE_CHIP_THRESHOLD = 200 // karakter — di atas ini, paste jadi "chip" bukan teks mentah di input

function CodeBlock({ inline, className, children }: any) {
  const [copied, setCopied] = useState(false)
  const text = String(children).replace(/\n$/, '')

  if (inline) {
    return <code style={{
      background: 'var(--input-bg)', padding: '1px 5px', borderRadius: 4,
      fontSize: '0.9em', fontFamily: 'monospace'
    }}>{text}</code>
  }

  const lang = /language-(\w+)/.exec(className || '')?.[1]

  return (
    <div style={{ margin: '8px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '4px 10px', background: 'var(--bg-elevated)', fontSize: 11.5, color: 'var(--fg-muted)'
      }}>
        <span>{lang || 'code'}</span>
        <button
          type="button"
          onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          style={{ background: 'none', border: 'none', color: 'var(--fg-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{copied ? 'check' : 'content_copy'}</span>
          {copied ? 'Disalin' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '10px 12px', background: 'var(--input-bg)', overflowX: 'auto' }}>
        <code style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--fg-primary)' }}>{text}</code>
      </pre>
    </div>
  )
}

function PastedChipView({ chip }: { chip: PastedChip }) {
  const [expanded, setExpanded] = useState(false)
  const preview = chip.text.length > 60 ? chip.text.slice(0, 60) + '…' : chip.text

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        cursor: 'pointer', padding: '6px 10px', borderRadius: 8, marginBottom: 6,
        background: 'var(--input-bg)', border: '1px solid var(--border)', fontSize: 12.5
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg-secondary)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>description</span>
        Teks tempel · {chip.text.length.toLocaleString('id-ID')} karakter
        <span className="material-symbols-outlined" style={{ fontSize: 15, marginLeft: 'auto' }}>
          {expanded ? 'expand_less' : 'expand_more'}
        </span>
      </div>
      {expanded ? (
        <div style={{ marginTop: 6, whiteSpace: 'pre-wrap', color: 'var(--fg-primary)', maxHeight: 200, overflowY: 'auto' }}>{chip.text}</div>
      ) : (
        <div style={{ marginTop: 4, color: 'var(--fg-muted)', fontStyle: 'italic' }}>{preview}</div>
      )}
    </div>
  )
}

export function AiChatPanel() {
  const isAiChatOpen = useAppStore(s => s.isAiChatOpen)
  const isAiChatExpanded = useAppStore(s => s.isAiChatExpanded)
  const toggleAiChat = useAppStore(s => s.toggleAiChat)
  const toggleAiChatExpanded = useAppStore(s => s.toggleAiChatExpanded)
  const profile = useAppStore(s => s.profile)
  const showToast = useAppStore(s => s.showToast)
  const setTasks = useAppStore(s => s.setTasks)
  const tasks = useAppStore(s => s.tasks)

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Halo! Ada yang bisa saya bantu terkait PKL atau tugas hari ini?' }
  ])
  const [input, setInput] = useState('')
  const [pastedChips, setPastedChips] = useState<PastedChip[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [activeMentions, setActiveMentions] = useState<MentionRef[]>([])
  const [mentionHighlight, setMentionHighlight] = useState(0)

  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')

  // Konfirmasi hapus giliran chat (dipakai kembali dari komponen ConfirmModal yang sudah ada di project)
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null)

  const mentionCandidates = useMemo(() => {
    const list = tasks.filter(t => t.status !== 'done')
    if (!mentionQuery) return list.slice(0, 8)
    const q = mentionQuery.toLowerCase()
    return list.filter(t => t.title.toLowerCase().includes(q)).slice(0, 8)
  }, [tasks, mentionQuery])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (isAiChatOpen) {
      apiClient.getTasks().then(setTasks).catch(() => {/* tidak kritis */})
    }
  }, [isAiChatOpen, setTasks])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setInput(value)
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

  function handleInputPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pastedText = e.clipboardData.getData('text')
    if (pastedText.length > PASTE_CHIP_THRESHOLD) {
      e.preventDefault()
      setPastedChips(prev => [...prev, { id: crypto.randomUUID(), text: pastedText }])
    }
  }

  function removePastedChip(id: string) {
    setPastedChips(prev => prev.filter(c => c.id !== id))
  }

  function selectMention(task: { id: string, title: string }) {
    const cursorPos = inputRef.current?.selectionStart ?? input.length
    const textBeforeCursor = input.slice(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf('@')
    if (atIndex === -1) return
    const before = input.slice(0, atIndex)
    const after = input.slice(cursorPos)
    setInput(`${before}@${task.title} ${after}`)
    setActiveMentions(prev => [...prev, { id: task.id, label: task.title }])
    setMentionQuery(null)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (mentionQuery !== null && mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionHighlight(h => Math.min(h + 1, mentionCandidates.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionHighlight(h => Math.max(h - 1, 0)); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); selectMention(mentionCandidates[mentionHighlight]); return }
      if (e.key === 'Escape') { setMentionQuery(null); return }
    }
  }

  function applySuggestion(prefill: string) {
    setInput(prefill)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function toApiMessages(conversation: ChatMessage[], fullPrompt: string) {
    return conversation
      .filter(m => !String(m.content || '').startsWith('[Error]'))
      .map((m, idx, arr) => ({
        role: m.role,
        content: idx === arr.length - 1 && m.role === 'user' ? fullPrompt : m.content,
      }))
  }

  async function sendMessage(
    text: string,
    mentions: MentionRef[],
    chips: PastedChip[],
    priorMessages: ChatMessage[],
    appendUser = true,
  ) {
    // Gabungkan isi chip tempelan + teks ketikan jadi satu prompt penuh yang dikirim ke AI,
    // tapi UI tetap menampilkan chip terpisah supaya history chat tidak penuh teks raksasa.
    const fullPrompt = [...chips.map(c => c.text), text].filter(Boolean).join('\n\n')
    const userEntry: ChatMessage = { role: 'user', content: text, mentions, pastedChips: chips }
    const conversation = appendUser ? [...priorMessages, userEntry] : priorMessages

    if (appendUser) {
      setMessages(conversation)
    }
    setIsLoading(true)

    try {
      let reply = 'Maaf, terjadi kesalahan.'
      let actionTaken: any = null
      const apiMessages = toApiMessages(conversation, fullPrompt)

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
              ...apiMessages,
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
              ...apiMessages,
            ],
            stream: false
          })
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error || 'Gagal menghubungi Ollama')
        reply = data.message.content
      }
      else {
        const history = apiMessages
          .slice(0, -1)
          .filter((m, i) => !(i === 0 && m.role === 'assistant'))
          .map(m => ({ role: m.role, content: m.content }))
        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: fullPrompt,
            mentionedTaskIds: mentions.map(m => m.id),
            history,
          })
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
    if (!text && pastedChips.length === 0) return

    const mentions = activeMentions
    const chips = pastedChips
    setInput('')
    setActiveMentions([])
    setPastedChips([])
    setMentionQuery(null)
    await sendMessage(text, mentions, chips, messages, true)
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
    const originalMentions = messages[index]?.mentions || []
    const originalChips = messages[index]?.pastedChips || []
    const prior = messages.slice(0, index)
    setMessages(prior)
    setEditingIndex(null)
    setEditingText('')
    await sendMessage(newText, originalMentions, originalChips, prior, true)
  }

  function copyMessage(text: string) {
    navigator.clipboard.writeText(text)
    showToast('Pesan disalin ke clipboard')
  }

  async function regenerateLast() {
    // Cari pesan user terakhir sebelum pesan assistant paling akhir, lalu kirim ulang
    const lastUserIndex = [...messages].reverse().findIndex(m => m.role === 'user')
    if (lastUserIndex === -1) return
    const realIndex = messages.length - 1 - lastUserIndex
    const userMsg = messages[realIndex]
    const conversation = messages.slice(0, realIndex + 1) // buang jawaban lama, sisakan pesan user itu
    setMessages(conversation)
    await sendMessage(userMsg.content, userMsg.mentions || [], userMsg.pastedChips || [], conversation, false)
  }

  function requestDeleteTurn(userIndex: number) {
    setDeleteConfirmIndex(userIndex)
  }

  function confirmDeleteTurn() {
    if (deleteConfirmIndex === null) return
    // Hapus pesan user ini + jawaban assistant setelahnya (kalau ada)
    setMessages(prev => {
      const next = [...prev]
      const hasFollowingAssistant = next[deleteConfirmIndex + 1]?.role === 'assistant'
      next.splice(deleteConfirmIndex, hasFollowingAssistant ? 2 : 1)
      return next
    })
    setDeleteConfirmIndex(null)
  }

  const deleteTargetHasAction = deleteConfirmIndex !== null && messages[deleteConfirmIndex + 1]?.actionTaken

  const isFreshChat = messages.length === 1 && input.trim() === '' && pastedChips.length === 0
  const lastAssistantIndex = [...messages].map((m, i) => m.role === 'assistant' ? i : -1).filter(i => i !== -1).pop()

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
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
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
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{ code: CodeBlock as any }}
                  >
                    {m.content}
                  </ReactMarkdown>

                  {m.actionTaken && m.actionTaken.type === 'create_task' && (
                    <div className="ai-action-card">
                      <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: 18, marginTop: 2 }}>check_circle</span>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--fg-primary)' }}>
                        <div>Task baru ditambahkan:</div>
                        <div style={{ fontWeight: 600 }}>{m.actionTaken.data.title}</div>
                      </div>
                    </div>
                  )}
                  {m.actionTaken && m.actionTaken.type === 'create_quick_note' && (
                    <div className="ai-action-card">
                      <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: 18, marginTop: 2 }}>check_circle</span>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--fg-primary)' }}>
                        <div>Catatan cepat disimpan:</div>
                        <div style={{ fontWeight: 600 }}>{m.actionTaken.data.teks}</div>
                      </div>
                    </div>
                  )}
                  {m.actionTaken && m.actionTaken.type === 'update_task_status' && (
                    <div className="ai-action-card">
                      <span className="material-symbols-outlined" style={{ color: 'var(--success)', fontSize: 18, marginTop: 2 }}>check_circle</span>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--fg-primary)' }}>
                        <div>Status task diperbarui:</div>
                        <div style={{ fontWeight: 600 }}>{m.actionTaken.data.title} → {m.actionTaken.data.status}</div>
                      </div>
                    </div>
                  )}

                  <div className="chat-msg-toolbar">
                    <button type="button" className="btn-icon chat-msg-action-btn" title="Salin" onClick={() => copyMessage(m.content)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>content_copy</span>
                    </button>
                    {i === lastAssistantIndex && !isLoading && (
                      <button type="button" className="btn-icon chat-msg-action-btn" title="Ulangi jawaban" onClick={regenerateLast}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>refresh</span>
                      </button>
                    )}
                  </div>
                </>
              ) : editingIndex === i ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text"
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    autoFocus
                    style={{ width: '100%' }}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(i); if (e.key === 'Escape') cancelEdit() }}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-outline-primary btn-sm" onClick={cancelEdit}>Batal</button>
                    <button type="button" className="btn-primary btn-sm" onClick={() => saveEdit(i)}>Simpan</button>
                  </div>
                </div>
              ) : (
                <>
                  {(m.pastedChips || []).map(chip => <PastedChipView key={chip.id} chip={chip} />)}
                  {m.content}
                  <div className="chat-msg-toolbar chat-msg-toolbar-user">
                    <button type="button" className="btn-icon chat-msg-action-btn" title="Edit pesan" onClick={() => startEdit(i, m.content)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                    </button>
                    <button type="button" className="btn-icon chat-msg-action-btn" title="Hapus giliran ini" onClick={() => requestDeleteTurn(i)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                    </button>
                  </div>
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
              onClick={() => applySuggestion(chip.prefill)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 10px', borderRadius: 999,
                border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                color: 'var(--fg-secondary)', fontSize: 12.5, cursor: 'pointer'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{chip.icon}</span>
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {pastedChips.length > 0 && (
        <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {pastedChips.map(chip => (
            <div key={chip.id} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
              background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12.5
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--fg-secondary)' }}>description</span>
              <span style={{ color: 'var(--fg-secondary)' }}>Teks tempel · {chip.text.length.toLocaleString('id-ID')} karakter</span>
              <button
                type="button"
                onClick={() => removePastedChip(chip.id)}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', display: 'flex' }}
                title="Hapus"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <form className="ai-chat-input-area" onSubmit={handleSend} style={{ position: 'relative' }}>
        {mentionQuery !== null && mentionCandidates.length > 0 && (
          <div style={{
            position: 'absolute', bottom: '100%', left: 12, right: 12, marginBottom: 6,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 20
          }}>
            {mentionCandidates.map((t, idx) => (
              <div
                key={t.id}
                onMouseDown={(e) => { e.preventDefault(); selectMention(t) }}
                style={{
                  padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                  background: idx === mentionHighlight ? 'var(--input-bg)' : 'transparent',
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
          onPaste={handleInputPaste}
          placeholder="Tanya sesuatu... (ketik @ untuk referensi task)"
          disabled={isLoading}
        />
        <button type="submit" className="btn-icon" disabled={(!input.trim() && pastedChips.length === 0) || isLoading}>
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>

      {deleteConfirmIndex !== null && (
        <ConfirmModal
          message={
            deleteTargetHasAction
              ? 'Giliran ini akan dihapus dari riwayat chat. Perlu diketahui: task/catatan yang sudah dibuat AI TIDAK akan ikut terhapus otomatis — ini hanya menghapus tampilan percakapannya.'
              : 'Hapus giliran percakapan ini dari riwayat chat?'
          }
          onConfirm={confirmDeleteTurn}
          onCancel={() => setDeleteConfirmIndex(null)}
        />
      )}
    </div>
  )
}