import { useState, useEffect } from 'react'
import './Cutscene.css'

const HERO_IMG = '/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_2.png'
const FALLBACK_IMG =
  '/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_2.png'

const BG = [
  '/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_2.png',
  '/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_2.png',
  '/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_2.png',
  '/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_2.png',
]

const PANELS = [
  {
    id: 1,
    theme: 'city',
    bg: BG[0],
    location: 'NEO-PANGEA CITY — 2087',
    narration:
      'A world run by one mega-corporation. Every arcade. Every score. Every legend — owned by OmniArc.',
    sfx: null,
    caption: null,
    alert: null,
    speech: null,
    hero: true,
  },
  {
    id: 2,
    theme: 'den',
    bg: BG[1],
    location: null,
    narration: null,
    sfx: null,
    caption: 'REX VOLTAGE — Undefeated Champion of the Underground Arcade Leagues.',
    alert: null,
    speech: 'One more round...\nand the crown is MINE.',
    hero: true,
  },
  {
    id: 3,
    theme: 'alert',
    bg: BG[2],
    location: null,
    narration: 'Then — without warning...',
    sfx: 'BZZT!!',
    caption: null,
    alert: '⚠  OMNI-ARC SYSTEM BREACH  ⚠\n      ALL RECORDS PURGED',
    speech: null,
    hero: true,
  },
  {
    id: 4,
    theme: 'dark',
    bg: BG[3],
    location: null,
    narration: 'Every high score. Every championship. Every legend — wiped from existence.',
    sfx: 'ERASED.',
    caption: null,
    alert: null,
    speech: null,
    hero: true,
  },
  {
    id: 5,
    theme: 'hero',
    bg: null,
    location: null,
    narration: null,
    sfx: 'CLICK!',
    caption: null,
    alert: null,
    speech: 'They took everything from me.\nNow I take it all BACK.',
    hero: true,
  },
]

export default function Cutscene({ onStart }) {
  const [phase, setPhase] = useState('overview') // 'overview' | 'zooming' | 'reading'
  const [current, setCurrent] = useState(0)
  const [exiting, setExiting] = useState(false)
  const [progress, setProgress] = useState(0)

  // Press Enter on overview to begin
  useEffect(() => {
    if (phase !== 'overview') return
    const onKey = (e) => { if (e.key === 'Enter') startReading() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  // Auto-advance every 5 s in reading mode (except last panel)
  useEffect(() => {
    if (phase !== 'reading' || current >= PANELS.length - 1) return
    setProgress(0)
    const duration = 5000
    const step = 50
    let elapsed = 0
    const prog = setInterval(() => { elapsed += step; setProgress((elapsed / duration) * 100) }, step)
    const adv  = setTimeout(() => goTo(current + 1), duration)
    return () => { clearInterval(prog); clearTimeout(adv) }
  }, [phase, current])

  const startReading = () => {
    setPhase('zooming')
    setTimeout(() => { setPhase('reading'); setCurrent(0) }, 450)
  }

  const goTo = (index) => {
    if (exiting || index === current) return
    setExiting(true)
    setTimeout(() => { setCurrent(index); setExiting(false) }, 260)
  }

  const advance = () => { if (current < PANELS.length - 1) goTo(current + 1) }

  const panel = PANELS[current]
  const isLast = current === PANELS.length - 1

  return (
    <div className="cutscene-screen">
      <div className="cutscene-header">
        <div>
          <span className="cutscene-logo">REX VOLTAGE</span>
          <span className="cutscene-subtitle">vs the OmniArc</span>
        </div>
        <button className="skip-btn" onClick={onStart}>SKIP ▶</button>
      </div>

      {/* ── OVERVIEW: all panels as a comic book page ── */}
      {(phase === 'overview' || phase === 'zooming') && (
        <div
          className={`comic-overview five-panels ${phase === 'zooming' ? 'zooming-in' : ''}`}
          onClick={startReading}
        >
          {PANELS.map((p, i) => (
            <div
              key={p.id}
              className={`overview-panel panel-slot-${i + 1} theme-${p.theme}`}
              style={p.bg ? { '--panel-bg': `url(${p.bg})` } : {}}
            >
              {p.bg && <div className="panel-bg-img" />}
              <div className="panel-color-overlay" />
              <div className="panel-halftone" />
              {p.location && <div className="mini-location">{p.location}</div>}
              {p.sfx     && <div className="mini-sfx">{p.sfx}</div>}
              {p.speech  && <div className="mini-speech">{p.speech.split('\n')[0]}</div>}
            </div>
          ))}
          <div className="overview-hint">CLICK OR PRESS ENTER</div>
        </div>
      )}

      {/* ── READING: one panel at a time with auto-advance ── */}
      {phase === 'reading' && (
        <>
          <div
            className={`comic-panel theme-${panel.theme} ${exiting ? 'panel-exit' : 'reading-enter'}`}
            onClick={isLast ? undefined : advance}
            style={panel.bg ? { '--panel-bg': `url(${panel.bg})` } : {}}
          >
            {/* ── Image section (top) ── */}
            <div className="panel-image-section">
              {panel.bg && <div className="panel-bg-img" />}
              <div className="panel-color-overlay" />
              <div className="panel-halftone" />

              {/* Panic face — only on panels with speech */}
              {panel.theme === 'alert' && panel.speech && (
                <div className="panic-face">
                  <div className="panic-eyes">
                    <div className="panic-eye"><div className="panic-pupil" /></div>
                    <div className="panic-eye"><div className="panic-pupil" /></div>
                  </div>
                  <div className="panic-mouth" />
                  <div className="panic-sweat" />
                  <div className="panic-sweat delay" />
                </div>
              )}

              {panel.location && <div className="caption-box location-cap">{panel.location}</div>}
              {panel.sfx      && <div className="sfx-word">{panel.sfx}</div>}
              {panel.alert    && <div className="alert-box"><pre>{panel.alert}</pre></div>}

              {/* Hero portrait — only on panels without a background image */}
              {panel.hero && !panel.bg && (
                <img src={HERO_IMG} alt="Rex Voltage" className="hero-portrait"
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMG }} />
              )}

              {/* Speech bubble anchored near the dino */}
              {panel.speech && (
                <div className={`speech-bubble speech-from-dino ${panel.theme === 'alert' ? 'panic-bubble' : ''}`}>
                  {panel.speech.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
              )}

              {!isLast && <div className="tap-hint">click to continue</div>}
            </div>

            {/* ── Text section (below image) ── */}
            <div className="panel-text-section">
              {panel.narration && <div className="narration-box">{panel.narration}</div>}
              {panel.caption   && <div className="caption-box bottom-cap">{panel.caption}</div>}
              {isLast && (
                <button className="start-btn" onClick={(e) => { e.stopPropagation(); onStart() }}>
                  ⚡ PLAY AS REX VOLTAGE ⚡
                </button>
              )}
            </div>
          </div>

          {/* Auto-advance progress bar */}
          {!isLast && (
            <div className="auto-progress">
              <div className="auto-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          )}
        </>
      )}

      <div className="panel-nav">
        {PANELS.map((p, i) => (
          <button
            key={p.id}
            className={`nav-dot ${i === current ? 'active' : i < current ? 'visited' : ''}`}
            onClick={() => { if (phase !== 'reading') startReading(); else goTo(i) }}
            aria-label={`Go to panel ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
