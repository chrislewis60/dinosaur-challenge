import { useState, useEffect } from 'react'
import './Cutscene.css'
import './MissionCutscene.css'
import BackgroundMusic from './BackgroundMusic'
import { useSoundManager } from './useSound'

const HERO_IMG = '/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_2.png'
const BG = '/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_2.png'

const PANELS = [
  {
    id: 1,
    theme: 'hero',
    bg: BG,
    location: 'OMNI-ARC WAREHOUSE',
    narration: null,
    sfx: null,
    caption: 'The terminal screen flickers. Data streams in — stolen files, encrypted records, and a new location.',
    alert: null,
    speech: 'Got it.\nPolice HQ.',
    hero: true,
  },
  {
    id: 2,
    theme: 'alert',
    bg: BG,
    location: null,
    narration: 'The warehouse was just the beginning. OmniArc has more evidence hidden in the police station.',
    sfx: 'DOWNLOADING...',
    caption: null,
    alert: null,
    speech: 'They thought they could\nhide it there.',
    hero: true,
  },
  {
    id: 3,
    theme: 'hero',
    bg: BG,
    location: null,
    narration: null,
    sfx: 'COORDINATES LOCKED.',
    caption: null,
    alert: '⚠  INITIATING TRANSFER  ⚠\n   LEVEL 2: POLICE HQ',
    speech: null,
    hero: true,
  },
  {
    id: 4,
    theme: 'dark',
    bg: BG,
    location: null,
    narration: 'Digital light swirls around Rex as the network pulls him to the next location.',
    sfx: 'TRANSFERRING...',
    caption: null,
    alert: null,
    speech: null,
    hero: true,
  },
  {
    id: 5,
    theme: 'hero',
    bg: null,
    location: 'POLICE HEADQUARTERS',
    narration: null,
    sfx: 'MATERIALIZED.',
    caption: null,
    alert: null,
    speech: 'Time to finish this.\nFind the evidence.\nGet out clean.',
    hero: true,
  },
]

export default function Level2Cutscene({ onComplete }) {
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
          <span className="cutscene-subtitle">Level 2: Police HQ</span>
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
                <img
                  src={HERO_IMG}
                  alt="Rex Voltage"
                  className="hero-portrait"
                />
              )}

              {panel.speech && (
                <div className="speech-bubble">
                  <div className="speech-tail" />
                  {panel.speech}
                </div>
              )}
            </div>

            <div className="panel-text-section">
              {panel.caption   && <div className="caption-box bottom-cap">{panel.caption}</div>}
              {panel.narration && <div className="narration-box">{panel.narration}</div>}
            </div>

            {!isLast && (
              <div className="auto-progress">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>

          <div className="panel-nav">
            {isLast ? (
              <button 
                className="action-btn big" 
                onClick={() => {
                  playSound('/sounds/mission-start.mp3', 0.6)
                  onComplete()
                }}
              >
                BEGIN LEVEL 2 →
              </button>
            ) : (
              <div className="nav-hint">CLICK TO ADVANCE</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
