import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { storage } from '../lib/storage'
import { DEFAULT_CHARACTERS, MOOD_OPTIONS, COLOR_PRESETS, ACCENT_COLORS } from '../lib/characters'
import { showToast } from '../lib/ui'
import BottomNav, { DesktopNav } from '../components/shared/BottomNav'

const BLANK = () => ({
  id: `custom_${Date.now()}`,
  name: '', kanji: '', mood: 'Warm', moodTag: 'warm',
  colors: ['#fdf0f5', '#f9c0cb'], accent: '#c96a84',
  textDark: true, desc: '', nsfw: false,
  speechStyle: '', traits: '', rules: '', system: '',
  backstory: '', storylines: [''],
  gender: 'female',
  measurements: { height: '', weight: '', bust: '', waist: '', hips: '' },
  braSize: '', braCup: '', pantiesNumSize: '', pantiesAlphaSize: '',
  dressCombo: '', innerwear: '',
})

export default function StudioPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')

  const [chars, setChars] = useState([])
  const [form, setForm] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [previewChar, setPreviewChar] = useState(null)

  useEffect(() => {
    setChars(storage.getCustomChars())
    if (editId) {
      const c = storage.getCustomChars().find(c => c.id === editId)
      if (c) { setForm({ ...BLANK(), ...c }); setShowAdvanced(true) }
    }
  }, [editId])

  function patch(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }
  function patchMeasure(k, v) {
    setForm(f => ({ ...f, measurements: { ...f.measurements, [k]: v } }))
  }
  function patchStoryline(i, v) {
    setForm(f => { const s = [...(f.storylines || [''])]; s[i] = v; return { ...f, storylines: s } })
  }
  function addStoryline() { setForm(f => ({ ...f, storylines: [...(f.storylines || ['']), ''] })) }
  function removeStoryline(i) { setForm(f => { const s = [...(f.storylines || [''])]; s.splice(i, 1); return { ...f, storylines: s.length ? s : [''] } }) }

  function save() {
    if (!form.name.trim()) { showToast('Character needs a name'); return }
    if (editId) {
      storage.updateCustomChar(editId, form)
      showToast('Character updated ✓')
    } else {
      storage.addCustomChar(form)
      showToast('Character created ✓')
    }
    setChars(storage.getCustomChars())
    setForm(null)
    navigate('/studio')
  }

  function deleteChar(id) {
    if (!confirm('Delete this character?')) return
    storage.deleteCustomChar(id)
    setChars(storage.getCustomChars())
    showToast('Deleted')
  }

  if (form) return <StudioForm form={form} patch={patch} patchMeasure={patchMeasure} patchStoryline={patchStoryline} addStoryline={addStoryline} removeStoryline={removeStoryline} showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced} onSave={save} onCancel={() => { setForm(null); navigate('/studio') }} editId={editId} />

  return (
    <div className="page"><DesktopNav />
      <div className="topbar">
        <span className="topbar-kanji">響</span>
        <span className="topbar-title" style={{ flex: 1 }}>Studio</span>
        <button className="topbar-btn" onClick={() => setForm(BLANK())} title="New character">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      <div className="page-inner">
        {/* Default characters — compact grid */}
        <div className="section-label" style={{ marginBottom: '10px' }}>Default Characters</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', marginBottom: '28px' }}>
          {DEFAULT_CHARACTERS.map(c => (
            <button
              key={c.id}
              onClick={() => setPreviewChar(c)}
              style={{
                background: `linear-gradient(145deg,${c.colors[0]},${c.colors[1]})`,
                border: `1px solid ${c.accent}33`,
                borderRadius: '14px',
                padding: '12px 10px',
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '80px',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
            >
              <div style={{ position: 'absolute', right: -4, bottom: -8, fontFamily: 'var(--font-jp)', fontSize: '2.8rem', opacity: 0.1, color: c.accent, lineHeight: 1, pointerEvents: 'none' }}>{c.kanji}</div>
              <div style={{ fontFamily: 'var(--font-jp)', fontSize: '1.2rem', color: c.accent, lineHeight: 1, marginBottom: '4px' }}>{c.kanji}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '0.78rem', color: c.colors[0].match(/^#[0-3]/) ? '#f4e0e8' : 'var(--ink)', lineHeight: 1.2, marginBottom: '2px' }}>{c.name}</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.55rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: c.accent }}>{c.mood}</div>
            </button>
          ))}
        </div>

        {/* Custom characters */}
        <div className="section-label" style={{ marginBottom: '10px' }}>My Characters ({chars.length})</div>
        {chars.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 20px', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--muted)' }}>
            No custom characters yet.<br />Tap + to create one.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {chars.map(c => (
            <div key={c.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: c.accent + '22', color: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-jp)', fontSize: '1rem', flexShrink: 0 }}>{c.kanji || c.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>{c.name}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{c.mood}</div>
              </div>
              <button onClick={() => { setForm({ ...BLANK(), ...c }); navigate(`/studio?edit=${c.id}`) }} style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: 'var(--deep-rose)', padding: '4px 10px', borderRadius: '10px', border: '1px solid var(--border)', marginRight: 4 }}>Edit</button>
              <button onClick={() => deleteChar(c.id)} style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: '#d04040', padding: '4px 10px', borderRadius: '10px', border: '1px solid #f0b0b0' }}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      {/* Preview modal */}
      {previewChar && (
        <div className="overlay" onClick={() => setPreviewChar(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-jp)', fontSize: '2.5rem', color: previewChar.accent, marginBottom: 6 }}>{previewChar.kanji}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: 4 }}>{previewChar.name}</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>{previewChar.mood}</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>{previewChar.desc}</p>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setPreviewChar(null)}>Close</button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

function StudioForm({ form, patch, patchMeasure, patchStoryline, addStoryline, removeStoryline, showAdvanced, setShowAdvanced, onSave, onCancel, editId }) {
  return (
    <div className="page"><DesktopNav />
      <div className="topbar">
        <button className="topbar-btn" onClick={onCancel}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span className="topbar-title" style={{ flex: 1 }}>{editId ? 'Edit Character' : 'New Character'}</span>
        <button className="topbar-btn" onClick={onSave} style={{ color: 'var(--deep-rose)', fontFamily: 'var(--font-ui)', fontSize: '0.82rem' }}>Save</button>
      </div>

      <div className="page-inner">
        {/* Preview card */}
        <div style={{ background: `linear-gradient(145deg,${form.colors[0]},${form.colors[1]})`, borderRadius: 'var(--radius)', padding: '18px', marginBottom: '20px', position: 'relative', overflow: 'hidden', minHeight: 110, border: `1px solid ${form.accent}33` }}>
          <div style={{ position: 'absolute', right: -8, bottom: -14, fontFamily: 'var(--font-jp)', fontSize: '4.5rem', opacity: 0.1, lineHeight: 1, color: form.accent }}>{form.kanji || '?'}</div>
          <div style={{ fontFamily: 'var(--font-jp)', fontSize: '1.8rem', color: form.accent, marginBottom: 2 }}>{form.kanji || '?'}</div>
          <div style={{ fontSize: '1rem', fontWeight: 400, color: form.textDark ? 'var(--ink)' : '#f4e0e8', marginBottom: 2 }}>{form.name || 'Character Name'}</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: form.accent }}>{form.mood}</div>
        </div>

        {/* Basic */}
        <div className="card" style={{ marginBottom: '14px' }}>
          <div className="card-section">
            <div className="section-label">Identity</div>
            <input className="input" placeholder="Character name" value={form.name} onChange={e => patch('name', e.target.value)} style={{ marginBottom: 8 }} />
            <input className="input" placeholder="Kanji / symbol (e.g. 響)" value={form.kanji} onChange={e => patch('kanji', e.target.value)} style={{ marginBottom: 8 }} />
            <textarea className="input textarea" placeholder="Short description…" value={form.desc} onChange={e => patch('desc', e.target.value)} style={{ marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: 'var(--muted)' }}>Mood:</span>
              <select className="input" style={{ flex: 1, padding: '6px 10px' }} value={form.mood} onChange={e => patch('mood', e.target.value)}>
                {MOOD_OPTIONS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="card-section">
            <div className="section-label">Card Colors</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {COLOR_PRESETS.map((p, i) => (
                <button key={i} onClick={() => { patch('colors', p.colors); patch('textDark', !p.colors[0].match(/^#[0-3]/)) }}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${p.colors[0]},${p.colors[1]})`, border: `3px solid ${JSON.stringify(form.colors) === JSON.stringify(p.colors) ? 'var(--ink)' : 'transparent'}`, cursor: 'pointer' }}
                  title={p.label} />
              ))}
            </div>
            <div className="section-label">Accent Color</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {ACCENT_COLORS.map(ac => (
                <button key={ac} onClick={() => patch('accent', ac)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: ac, border: `3px solid ${form.accent === ac ? 'var(--ink)' : 'transparent'}`, cursor: 'pointer' }} />
              ))}
            </div>
          </div>

          <div className="card-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--ink)' }}>18+ Content</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.68rem', color: 'var(--muted)' }}>Requires age confirmation</div>
              </div>
              <button className={`toggle ${form.nsfw ? 'on' : ''}`} onClick={() => patch('nsfw', !form.nsfw)} />
            </div>
          </div>
        </div>

        {/* Personality */}
        <div className="card" style={{ marginBottom: '14px' }}>
          <div className="card-section">
            <div className="section-label">Personality</div>
            <textarea className="input textarea" placeholder="System prompt — who is this character? How do they think and feel?" value={form.system} onChange={e => patch('system', e.target.value)} style={{ marginBottom: 8 }} />
            <textarea className="input textarea" placeholder="Speech style — how do they talk?" value={form.speechStyle} onChange={e => patch('speechStyle', e.target.value)} style={{ marginBottom: 8 }} />
            <textarea className="input textarea" placeholder="Traits — personality details" value={form.traits} onChange={e => patch('traits', e.target.value)} style={{ marginBottom: 8 }} />
            <textarea className="input textarea" placeholder="Rules — hard limits (one per line)" value={form.rules} onChange={e => patch('rules', e.target.value)} />
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(v => !v)}
          style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--deep-rose)', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <span>Advanced (backstory, storylines, measurements)</span>
          <span>{showAdvanced ? '▲' : '▼'}</span>
        </button>

        {showAdvanced && (
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="card-section">
              <div className="section-label">Backstory</div>
              <textarea className="input textarea" placeholder="Character history…" value={form.backstory} onChange={e => patch('backstory', e.target.value)} />
            </div>

            <div className="card-section">
              <div className="section-label">Storylines</div>
              {(form.storylines || ['']).map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <input className="input" style={{ flex: 1 }} placeholder={`Scenario ${i + 1}…`} value={s} onChange={e => patchStoryline(i, e.target.value)} />
                  <button onClick={() => removeStoryline(i)} style={{ color: 'var(--muted)', fontSize: '1rem', padding: '0 6px' }}>✕</button>
                </div>
              ))}
              <button className="btn btn-ghost" style={{ marginTop: '4px', fontSize: '0.75rem' }} onClick={addStoryline}>+ Add storyline</button>
            </div>

            <div className="card-section">
              <div className="section-label">Gender</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['female', 'male', 'other'].map(g => (
                  <button key={g} onClick={() => patch('gender', g)}
                    style={{ padding: '6px 14px', borderRadius: '14px', border: `1.5px solid ${form.gender === g ? 'var(--deep-rose)' : 'var(--border)'}`, background: form.gender === g ? 'var(--petal)' : 'transparent', color: form.gender === g ? 'var(--deep-rose)' : 'var(--muted)', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', cursor: 'pointer' }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-section">
              <div className="section-label">Body Measurements (private)</div>
              {Object.keys(form.measurements || {}).map(k => (
                <div key={k} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: 'var(--muted)', width: 50, flexShrink: 0, textTransform: 'capitalize' }}>{k}</span>
                  <input className="input" style={{ flex: 1, padding: '6px 10px' }} placeholder="—" value={form.measurements[k]} onChange={e => patchMeasure(k, e.target.value)} />
                </div>
              ))}
            </div>

            <div className="card-section">
              <div className="section-label">Outfit & Innerwear (very private)</div>
              <textarea className="input textarea" placeholder="Usual outfit combination…" value={form.dressCombo} onChange={e => patch('dressCombo', e.target.value)} style={{ marginBottom: 8 }} />
              <textarea className="input textarea" placeholder="Innerwear details (three-stage trust applies)…" value={form.innerwear} onChange={e => patch('innerwear', e.target.value)} />
            </div>
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%', marginBottom: '8px' }} onClick={onSave}>
          {editId ? 'Update Character' : 'Create Character'}
        </button>
        <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onCancel}>Cancel</button>
      </div>

      <BottomNav />
    </div>
  )
}
