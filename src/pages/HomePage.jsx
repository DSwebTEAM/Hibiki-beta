import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_CHARACTERS, GREETINGS } from '../lib/characters'
import { storage } from '../lib/storage'
import { selectStoryline } from '../lib/ui'
import SakuraCanvas from '../components/shared/SakuraCanvas'
import BottomNav, { DesktopNav } from '../components/shared/BottomNav'

function useIsDesktop() {
  const [desktop, setDesktop] = useState(window.innerWidth >= 768)
  useEffect(() => {
    const fn = () => setDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return desktop
}

export default function HomePage() {
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const [dark, setDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark')
  const [chars, setChars] = useState([])
  const [nsfwModal, setNsfwModal] = useState(null)
  const [hoveredChar, setHoveredChar] = useState(null)
  const [pinnedDetail, setPinnedDetail] = useState(null)

  useEffect(() => {
    setChars([...DEFAULT_CHARACTERS, ...storage.getCustomChars()])
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    storage.setTheme(next ? 'dark' : 'light')
  }

  function openChar(char, forceNew = false) {
    if (char.nsfw && !storage.getNsfwOk()) { setNsfwModal({ char, forceNew }); return }
    startChat(char, forceNew)
  }

  function startChat(char, forceNew = false) {
    const storyline = selectStoryline(char)
    const greeting = GREETINGS[char.id] || `*looks up* Hello. I'm ${char.name}.`
    const newChat = {
      id: Date.now().toString(), charId: char.id,
      charName: char.name, charKanji: char.kanji || char.name[0],
      charColors: char.colors, charAccent: char.accent,
      tone: 'casual', runtimeInstruction: '',
      selectedStoryline: storyline,
      messages: [{ role: 'assistant', content: greeting }],
      createdAt: Date.now(), updatedAt: Date.now(),
    }
    const chat = forceNew ? storage.resetChatForChar(char.id, newChat) : storage.upsertChatForChar(char.id, newChat)
    navigate(`/chats?id=${chat.id}`)
  }

  const isDark = (c) => c.colors?.[0]?.match(/^#[0-3]/)
  const detailChar = pinnedDetail || hoveredChar

  if (!isDesktop) {
    return (
      <div className="page">
        <SakuraCanvas />
        <div className="topbar">
          <span className="topbar-kanji">響</span>
          <span className="topbar-title" style={{ flex: 1 }}>Hibiki</span>
          <button className="topbar-btn" onClick={toggleTheme}>{dark ? <SunIcon /> : <MoonIcon />}</button>
          <button className="topbar-btn" onClick={() => navigate('/studio')}><PlusIcon /></button>
        </div>
        <div className="page-inner" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(140px,40vw,200px),1fr))', gap: 'clamp(10px,3vw,16px)' }}>
            {chars.map((char, i) => (
              <CharCard key={char.id} char={char} i={i} cardDark={isDark(char)} onOpen={openChar} />
            ))}
          </div>
        </div>
        <BottomNav />
        {nsfwModal && <NsfwModal modal={nsfwModal} onConfirm={() => { storage.setNsfwOk(true); startChat(nsfwModal.char, nsfwModal.forceNew); setNsfwModal(null) }} onClose={() => setNsfwModal(null)} />}
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', paddingLeft: 200, background: 'var(--blush)', overflow: 'hidden' }}>
      <DesktopNav />
      <SakuraCanvas />
      <div style={{ flex: 1, overflow: 'auto', padding: '28px 28px 28px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)' }}>Characters</h1>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.7rem', color: 'var(--muted)', marginTop: '3px' }}>{chars.length} companions · hover to preview, click to pin</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="topbar-btn" onClick={toggleTheme}>{dark ? <SunIcon /> : <MoonIcon />}</button>
            <button className="btn btn-ghost" style={{ fontSize: '0.78rem' }} onClick={() => navigate('/studio')}>+ New Character</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px,1fr))', gap: '12px' }}>
          {chars.map((char, i) => (
            <div key={char.id}
              onMouseEnter={() => { if (!pinnedDetail) setHoveredChar(char) }}
              onMouseLeave={() => { if (!pinnedDetail) setHoveredChar(null) }}
              onClick={() => setPinnedDetail(p => p?.id === char.id ? null : char)}
            >
              <CharCard char={char} i={i} cardDark={isDark(char)} onOpen={openChar} desktop />
            </div>
          ))}
        </div>
      </div>
      <div style={{
        width: detailChar ? 290 : 0, minWidth: detailChar ? 290 : 0,
        overflow: 'hidden', transition: 'width 0.22s ease, min-width 0.22s ease',
        borderLeft: '1px solid var(--separator)', background: 'var(--surface)',
        display: 'flex', flexDirection: 'column', zIndex: 10, flexShrink: 0,
      }}>
        {detailChar && <DetailPanel char={detailChar} onOpen={openChar} onClose={() => { setPinnedDetail(null); setHoveredChar(null) }} isPinned={!!pinnedDetail} />}
      </div>
      {nsfwModal && <NsfwModal modal={nsfwModal} onConfirm={() => { storage.setNsfwOk(true); startChat(nsfwModal.char, nsfwModal.forceNew); setNsfwModal(null) }} onClose={() => setNsfwModal(null)} />}
    </div>
  )
}

function CharCard({ char, i, cardDark, onOpen, desktop }) {
  const existing = storage.getChatByCharId(char.id)
  return (
    <div className="char-card fade-up"
      style={{ background: `linear-gradient(145deg,${char.colors[0]},${char.colors[1]})`, borderColor: char.accent + '33', animationDelay: `${i * 0.04}s`, color: cardDark ? '#f4e0e8' : 'var(--ink)' }}
      onClick={() => !desktop && onOpen(char)}
    >
      <div className="char-card-bg-glyph" style={{ color: char.accent }}>{char.kanji || char.name[0]}</div>
      <div className="char-card-badges">
        {char.nsfw && <span className="badge badge-nsfw">18+</span>}
        {char.id.startsWith('custom_') && <span className="badge badge-custom">Custom</span>}
      </div>
      {existing && !desktop && <button className="new-chat-fab" onClick={e => { e.stopPropagation(); onOpen(char, true) }}>+ New</button>}
      <div className="char-card-kanji" style={{ color: char.accent }}>{char.kanji || char.name[0]}</div>
      <div className="char-card-name" style={{ color: cardDark ? '#f4e0e8' : 'var(--ink)' }}>{char.name}</div>
      <div className="char-card-mood" style={{ color: char.accent }}>{char.mood}</div>
      {!desktop && <div className="char-card-desc">{char.desc}</div>}
      {existing && <div className="has-chat-dot" style={{ '--accent-color': char.accent }} />}
    </div>
  )
}

function DetailPanel({ char, onOpen, onClose, isPinned }) {
  const existing = storage.getChatByCharId(char.id)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ background: `linear-gradient(160deg,${char.colors[0]},${char.colors[1]})`, padding: '24px 20px 18px', position: 'relative', flexShrink: 0 }}>
        {isPinned && <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, color: '#fff', opacity: 0.6, fontSize: '0.85rem', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', padding: '2px 7px' }}>✕</button>}
        <div style={{ fontFamily: 'var(--font-jp)', fontSize: '2.8rem', color: char.accent, lineHeight: 1, marginBottom: '8px' }}>{char.kanji || char.name[0]}</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: char.colors[0].match(/^#[0-3]/) ? '#f4e0e8' : 'var(--ink)', marginBottom: '3px' }}>{char.name}</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: char.accent }}>{char.mood}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.65, marginBottom: '16px' }}>{char.desc}</p>
        {char.speechStyle && <InfoBlock label="Speech style" value={char.speechStyle} accent={char.accent} />}
        {char.traits && <InfoBlock label="Traits" value={char.traits} accent={char.accent} />}
        {char.rules && <InfoBlock label="Hard rules" value={char.rules} accent={char.accent} mono />}
      </div>
      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--separator)', display: 'flex', flexDirection: 'column', gap: '7px', flexShrink: 0 }}>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => onOpen(char)}>{existing ? 'Continue Chat' : 'Start Chat'}</button>
        {existing && <button className="btn btn-ghost" style={{ width: '100%', fontSize: '0.75rem' }} onClick={() => onOpen(char, true)}>↺ New Conversation</button>}
      </div>
    </div>
  )
}

function InfoBlock({ label, value, accent, mono }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: mono ? 'monospace' : 'var(--font-serif)', fontSize: '0.82rem', color: 'var(--ink)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{value}</div>
    </div>
  )
}

function NsfwModal({ modal, onConfirm, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: 'var(--font-jp)', fontSize: '2.5rem', marginBottom: 10, color: 'var(--deep-rose)' }}>{modal.char.kanji}</div>
        <div style={{ fontSize: '1.05rem', fontWeight: 300, letterSpacing: '0.1em', marginBottom: 8 }}>{modal.char.name}</div>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>This character contains 18+ content. You must be an adult to continue.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onConfirm}>I'm 18+ — Continue</button>
          <button className="btn btn-ghost" onClick={onClose}>Go back</button>
        </div>
      </div>
    </div>
  )
}

function MoonIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> }
function SunIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> }
function PlusIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
