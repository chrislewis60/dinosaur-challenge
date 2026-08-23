import { useState, useEffect } from 'react'
import './Cutscene.css'
import './MissionCutscene.css'
import BackgroundMusic from './BackgroundMusic'
import { useSoundManager } from './useSound'

const HERO_IMG =
  '/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_2.png'
const BG =
  '/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_2.png'
// Standing dino used only on the suck-in slide
const SUCK_DINO_IMG = '/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_2.png'
const MATRIX_IMG    = '/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_0.png'
const SUCK_BG       = '/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_2.png'

const PANELS = [
  {
    id: 1,
    theme: 'den',
    bg: BG,
    location: 'UNDERGROUND ARCADE',
    narration: null,
    sfx: null,
    caption: 'Rex stares at the glowing terminal. OmniArc stole the game records. Every legend. Every score.',
    alert: null,
    speech: 'This is it.\nTime to take them back.',
    hero: true,
  },
  {
    id: 3,
    theme: 'alert',
    bg: BG,
    location: null,
    narration: 'Rex reaches forward — fingertip touching the pulsing screen...',
    sfx: 'BZZZT!!',
    caption: null,
    alert: '⚠  TRANSFER INITIATING  ⚠\n   DO NOT RESIST',
    speech: null,
    hero: true,
  },
  {
    id: 4,
    theme: 'suck',
    bg: SUCK_BG,
    location: null,
    narration: null,
    sfx: 'WHOOOOSH!!',
    caption: null,
    alert: null,
    speech: 'WAIT—\nWHAT IS HAPPENING?!',
    hero: false,
  },
  {
    id: 5,
    theme: 'dark',
    bg: BG,
    location: null,
    narration: 'In a blaze of digital light — Rex Voltage vanishes through the screen.',
    sfx: 'GONE.',
    caption: null,
    alert: null,
    speech: null,
    hero: true,
  },
  {
    id: 6,
    theme: 'hero',
    bg: null,
    location: 'OMNI-ARC WAREHOUSE',
    narration: null,
    sfx: 'MATERIALIZED.',
    caption: null,
    alert: null,
    speech: 'I\'m here.\nFind the records.\nUpload them back.',
    hero: true,
  },
]

export default function MissionCutscene({ onComplete }) {
  const [phase, setPhase] = useState('overview')
  const [current, setCurrent] = useState(0)
  const [exiting, setExiting] = useState(false)
  const [progress, setProgress] = useState(0)
  const { play: playSound } = useSoundManager()

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
    playSound('/sounds/click.mp3', 0.5)
    setPhase('zooming')
    setTimeout(() => { setPhase('reading'); setCurrent(0) }, 450)
  }

  const goTo = (index) => {
    if (exiting || index === current) return
    playSound('/sounds/click.mp3', 0.3)
    setExiting(true)
    setTimeout(() => { setCurrent(index); setExiting(false) }, 260)
  }

  const advance = () => { if (current < PANELS.length - 1) goTo(current + 1) }

  const panel = PANELS[current]
  const isLast = current === PANELS.length - 1

  return (
    <div className="cutscene-screen">
      <BackgroundMusic src="/music/mission.mp3" volume={0.4} play={true} />
      <div className="cutscene-header">
        <div>
          <span className="cutscene-logo">REX VOLTAGE</span>
          <span className="cutscene-subtitle">Mission Start</span>
        </div>
        <button 
          className="skip-btn" 
          onClick={() => {
            playSound('/sounds/click.mp3', 0.5)
            onComplete()
          }}
        >
          SKIP ▶
        </button>
      </div>

      {/* ── OVERVIEW: all panels as a comic book page ── */}
      {(phase === 'overview' || phase === 'zooming') && (
        <div
          className={`comic-overview six-panels ${phase === 'zooming' ? 'zooming-in' : ''}`}
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
              {p.sfx      && <div className="mini-sfx">{p.sfx}</div>}
              {p.speech   && <div className="mini-speech">{p.speech.split('\n')[0]}</div>}
            </div>
          ))}
          <div className="overview-hint">CLICK OR PRESS ENTER</div>
        </div>
      )}

      {/* ── READING: one panel at a time ── */}
      {phase === 'reading' && (
        <>
          <div
            className={`comic-panel theme-${panel.theme} ${exiting ? 'panel-exit' : 'reading-enter'}`}
            onClick={isLast ? undefined : advance}
            style={panel.bg ? { '--panel-bg': `url(${panel.bg})` } : {}}
          >
            <div className="panel-image-section">
              {panel.bg && <div className="panel-bg-img" />}
              <div className="panel-color-overlay" />
              <div className="panel-halftone" />

              {panel.location && <div className="caption-box location-cap">{panel.location}</div>}
              {panel.sfx      && <div className="sfx-word">{panel.sfx}</div>}
              {panel.alert    && <div className="alert-box"><pre>{panel.alert}</pre></div>}

              {panel.hero && !panel.bg && (
                panel.theme === 'suck' ? (
                  /* Two-layer composite: blurred bg + clipped dino on top */
                  <div className="suck-composite">
                    <img src={MATRIX_IMG}    alt="" className="suck-matrix-bg" aria-hidden="true" />
                    <img src={SUCK_DINO_IMG} alt="Rex Voltage" className="suck-dino-img" />
                  </div>
                ) : (
                  <img
                    src={HERO_IMG}
                    alt="Rex Voltage"
                    className="hero-portrait"
                  />
                )
              )}

              {panel.speech && (
                <div className="speech-bubble speech-from-dino">
                  {panel.speech.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
              )}

              {!isLast && <div className="tap-hint">click to continue</div>}
            </div>

            <div className="panel-text-section">
              {panel.narration && <div className="narration-box">{panel.narration}</div>}
              {panel.caption   && <div className="caption-box bottom-cap">{panel.caption}</div>}
              {isLast && (
                <button
                  className="start-btn"
                  onClick={(e) => { e.stopPropagation(); onComplete() }}
                >
                  ⚡ BEGIN THE HUNT ⚡
                </button>
              )}
            </div>
          </div>

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
