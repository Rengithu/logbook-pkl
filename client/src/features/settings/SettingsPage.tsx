import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/appStore'
import * as api from '../../api/client'
import { CustomDropdown } from '../../components/CustomDropdown'

export function SettingsPage() {
  const currentTheme = useAppStore((s) => s.currentTheme)
  const setTheme = useAppStore((s) => s.setTheme)
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)
  const showToast = useAppStore((s) => s.showToast)
  const [apiProvider, setApiProvider] = useState<'gemini' | 'openrouter' | 'ollama'>(profile?.apiProvider || 'gemini')
  const [apiKey, setApiKey] = useState(profile?.geminiApiKey || '')
  const [openRouterKey, setOpenRouterKey] = useState(profile?.openRouterApiKey || '')
  const [ollamaUrl, setOllamaUrl] = useState(profile?.ollamaUrl || 'http://localhost:11434')
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    if (profile) {
      if (profile.geminiApiKey !== undefined) setApiKey(profile.geminiApiKey)
      if (profile.apiProvider) setApiProvider(profile.apiProvider)
      if (profile.openRouterApiKey !== undefined) setOpenRouterKey(profile.openRouterApiKey)
      if (profile.ollamaUrl !== undefined) setOllamaUrl(profile.ollamaUrl)
    }
  }, [profile])

  // Auto-Save Effect
  useEffect(() => {
    if (!profile) return

    const isChanged = 
      apiKey !== (profile.geminiApiKey || '') ||
      apiProvider !== (profile.apiProvider || 'gemini') ||
      openRouterKey !== (profile.openRouterApiKey || '') ||
      ollamaUrl !== (profile.ollamaUrl || 'http://localhost:11434')

    if (!isChanged) return

    const handler = setTimeout(async () => {
      try {
        const updated = await api.updateProfile({ 
          geminiApiKey: apiKey,
          apiProvider,
          openRouterApiKey: openRouterKey,
          ollamaUrl
        })
        setProfile(updated)
        // Silently save
      } catch (err: any) { 
        showToast('Gagal menyimpan pengaturan: ' + err.message, true) 
      }
    }, 800) // 800ms debounce

    return () => clearTimeout(handler)
  }, [apiKey, apiProvider, openRouterKey, ollamaUrl, profile, setProfile, showToast])

  return (
    <section id="tab-settings" className="tab-panel active">
      <div style={{ padding: '16px 32px', width: '100%' }}>
        <div className="page-header"><h2 className="page-title">Pengaturan Aplikasi</h2></div>

        {/* Theme */}
        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 8, fontWeight: 500 }}>Tampilan (Tema)</h3>
          <p className="hint" style={{ margin: '0 0 16px' }}>Pilih mode terang atau gelap.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['dark', 'light', 'system'] as const).map(t => (
              <button 
                key={t} 
                className={`btn btn-outline ${currentTheme === t ? 'active' : ''}`} 
                style={{ flex: 1, justifyContent: 'center', padding: '12px 0' }}
                title={t === 'dark' ? 'Mode Gelap' : t === 'light' ? 'Mode Terang' : 'Sistem'}
                onClick={() => { setTheme(t); showToast(`Tema diubah ke ${t}`) }}
              >
                <span className="material-symbols-outlined" style={{ margin: 0, fontSize: 24 }}>
                  {t === 'dark' ? 'dark_mode' : t === 'light' ? 'light_mode' : 'desktop_windows'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Provider & API Key */}
        <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 8, fontWeight: 500 }}>Pengaturan AI Chat</h3>
            <p className="hint" style={{ margin: '0 0 16px' }}>Pilih provider AI yang ingin digunakan untuk fitur Chat.</p>
            
            <div className="form-row" style={{ marginBottom: 16 }}>
              <label>Provider AI</label>
              <CustomDropdown 
                value={apiProvider} 
                onChange={(val: string) => setApiProvider(val as any)}
                options={[
                  { value: 'gemini', label: 'Google Gemini' },
                  { value: 'openrouter', label: 'OpenRouter' },
                  { value: 'ollama', label: 'Ollama (Lokal)' }
                ]}
              />
            </div>

            {apiProvider === 'gemini' && (
              <div className="form-row" style={{ marginBottom: 16 }}>
                <label>API Key Gemini</label>
                <div className="api-key-row" style={{ marginBottom: 0 }}>
                  <input type={showKey ? 'text' : 'password'} placeholder="AIzaSy..." style={{ flex: 1 }} value={apiKey} onChange={e => setApiKey(e.target.value)} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowKey(!showKey)}>
                    <span className="material-symbols-outlined">{showKey ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            )}

            {apiProvider === 'openrouter' && (
              <div className="form-row" style={{ marginBottom: 16 }}>
                <label>API Key OpenRouter</label>
                <div className="api-key-row" style={{ marginBottom: 0 }}>
                  <input type={showKey ? 'text' : 'password'} placeholder="sk-or-v1-..." style={{ flex: 1 }} value={openRouterKey} onChange={e => setOpenRouterKey(e.target.value)} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowKey(!showKey)}>
                    <span className="material-symbols-outlined">{showKey ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            )}

            {apiProvider === 'ollama' && (
              <div className="form-row" style={{ marginBottom: 16 }}>
                <label>URL Ollama</label>
                <input type="text" className="input" placeholder="http://localhost:11434" value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)} />
              </div>
            )}
            
            <p className="hint" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--primary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cloud_done</span>
              Semua perubahan di halaman ini disimpan secara otomatis
            </p>
        </div>
      </div>
    </section>
  )
}
