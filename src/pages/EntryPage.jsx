import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { storage } from '../lib/storage'
import { PROVIDER_LIST, detectProvider } from '../lib/providers'
import SakuraCanvas from '../components/shared/SakuraCanvas'

export default function EntryPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('openrouter')
  const [keys, setKeys] = useState({})
  const [inputVal, setInputVal] = useState('')
  const [hint, setHint] = useState('')
  const [hintOk, setHintOk] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (storage.hasApiKey()) navigate('/home', { replace: true })
    const saved = storage.getProviderKeys()
    setKeys(saved)
    setInputVal(saved[activeTab] ? maskKey(saved[activeTab]) : '')
  }, [])

  useEffect(() => {
    const saved = storage.getProviderKeys()
    setInputVal(saved[activeTab] ? maskKey(saved[activeTab]) : '')
    setHint(''); setHintOk(null)
  }, [activeTab])

  function maskKey(k) {
    if (!k || k.length < 10) return k
    return k.slice(0, 8) + '·'.repeat(Math.min(20, k.length - 12)) + k.slice(-4)
  }

  function handleInput(e) {
    const v = e.target.value
    setInputVal(v)
    if (!v.trim()) { setHint(''); setHintOk(null); return }
    const detected = detectProvider(v.trim())
    if (detected && detected !== activeTab) {
      setHint(`Looks like a ${detected} key — switching tab`)
      setHintOk(false)
    } else if (detected === activeTab) {
      setHint('Key format recognised ✓')
      setHintOk(true)
    } else {
      setHint('Format unknown — will save anyway')
      setHintOk(null)
    }
  }

  function saveKey() {
    const v = inputVal.trim()
    if (!v || v.includes('·')) return
    setSaving(true)
    const detected = detectProvider(v) || activeTab
    storage.setKeyFor(detected, v)
    storage.setActiveProvider(detected)
    setKeys(storage.getProviderKeys())
    setTimeout(() => {
      setSaving(false)
      navigate('/home', { replace: true })
    }, 400)
  }

  function removeKey(pid) {
    storage.removeKeyFor(pid)
    setKeys(storage.getProviderKeys())
    if (pid === activeTab) setInputVal('')
  }

  const provider = PROVIDER_LIST.find(p => p.id === activeTab)
  const hasSavedKeys = Object.values(keys).some(Boolean)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--blush)', overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <SakuraCanvas />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--font-jp)', fontSize: '3.5rem', color: 'var(--deep-rose)', lineHeight: 1 }}>響</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: '6px' }}>Hibiki · Your companion</div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '24px' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', color: 'var(--muted)', marginBottom: '20px', lineHeight: 1.6 }}>
            Paste your API key below. Keys stay in your browser only — never sent anywhere except the AI provider.
          </p>

          {/* Provider tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {PROVIDER_LIST.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 11px', borderRadius: '20px',
                  border: `1.5px solid ${activeTab === p.id ? p.color : 'var(--border)'}`,
                  background: activeTab === p.id ? p.color + '18' : 'transparent',
                  color: activeTab === p.id ? p.color : 'var(--muted)',
                  fontFamily: 'var(--font-ui)', fontSize: '0.72rem', letterSpacing: '0.05em',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: keys[p.id] ? '#40d080' : 'var(--border)', flexShrink: 0, display: 'inline-block' }} />
                {p.emoji} {p.name}
              </button>
            ))}
          </div>

          {/* Key input */}
          <div style={{ marginBottom: '6px' }}>
            <input
              className="input"
              type="text"
              placeholder={provider?.keyHint || 'Paste API key…'}
              value={inputVal}
              onChange={handleInput}
              onFocus={e => { if (e.target.value.includes('·')) { setInputVal(''); setHint(''); setHintOk(null) } }}
              style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem' }}
            />
          </div>
          {hint && (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', color: hintOk === true ? '#40c070' : hintOk === false ? '#d07030' : 'var(--muted)', marginBottom: '10px', minHeight: 16 }}>
              {hint}
            </div>
          )}

          <a href={provider?.keyDocs} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', color: 'var(--deep-rose)', display: 'block', marginBottom: '16px', textDecoration: 'none' }}>
            Get a {provider?.name} key →
          </a>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={saveKey} disabled={!inputVal.trim() || inputVal.includes('·') || saving}>
            {saving ? 'Saving…' : 'Save & Continue'}
          </button>

          {/* Saved keys list */}
          {hasSavedKeys && (
            <div style={{ marginTop: '20px' }}>
              <div className="section-label">Saved keys</div>
              {PROVIDER_LIST.filter(p => keys[p.id]).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--petal)', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '6px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: p.color }}>{p.emoji} {p.name}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--muted)', flex: 1 }}>{maskKey(keys[p.id])}</span>
                  <span style={{ background: '#0e2a1a', color: '#40d080', fontFamily: 'var(--font-ui)', fontSize: '0.58rem', padding: '2px 6px', borderRadius: '6px' }}>active</span>
                  <button onClick={() => removeKey(p.id)} style={{ color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1, padding: '2px 4px' }}>✕</button>
                </div>
              ))}
              {hasSavedKeys && (
                <button className="btn btn-ghost" style={{ width: '100%', marginTop: '8px' }} onClick={() => navigate('/home', { replace: true })}>
                  Continue with saved key →
                </button>
              )}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: '0.65rem', color: 'var(--muted)', marginTop: '16px', lineHeight: 1.6 }}>
          Free options: OpenRouter free-tier · Groq (all free) · Together AI free models
        </p>
      </div>
    </div>
  )
}
