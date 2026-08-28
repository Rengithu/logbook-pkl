import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

export function AiChatPanel() {
  const isAiChatOpen = useAppStore(s => s.isAiChatOpen)
  const isAiChatExpanded = useAppStore(s => s.isAiChatExpanded)
  const toggleAiChat = useAppStore(s => s.toggleAiChat)
  const toggleAiChatExpanded = useAppStore(s => s.toggleAiChatExpanded)
  const profile = useAppStore(s => s.profile)
  const showToast = useAppStore(s => s.showToast)

  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'Halo! Ada yang bisa saya bantu terkait PKL atau tugas hari ini?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setIsLoading(true)

    try {
      let reply = 'Maaf, terjadi kesalahan.'

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
              ...messages,
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
              ...messages,
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
        // Default to Gemini (using existing backend API)
        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Gagal menghubungi Gemini')
        reply = data.result
      }

      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err: any) {
      showToast(err.message, true)
      setMessages(prev => [...prev, { role: 'assistant', content: `[Error] ${err.message}` }])
    } finally {
      setIsLoading(false)
    }
  }

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
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            <div className="chat-bubble">
              {m.role === 'assistant' ? (
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {m.content}
                </ReactMarkdown>
              ) : (
                m.content
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

      <form className="ai-chat-input-area" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Tanya sesuatu..."
          disabled={isLoading}
        />
        <button type="submit" className="btn-icon" disabled={!input.trim() || isLoading}>
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  )
}
