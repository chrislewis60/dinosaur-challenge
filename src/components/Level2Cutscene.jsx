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

  // Auto-start after 1 second
  useEffect(() => {
    const timer = setTimeout(() => {
      if (phase === 'overview') startReading()
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Press Enter on overview to begin manually
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
              className={`comic-panel theme-${p.theme}`}
              style={{ backgroundImage: p.bg ? `url(${p.bg})` : 'none' }}
            >
              {p.hero && <img src={HERO_IMG} alt="" className="panel-hero" />}
              {p.location && <div className="panel-loc">{p.location}</div>}
              {p.narration && <div className="panel-narration">{p.narration}</div>}
              {p.sfx && <div className="panel-sfx">{p.sfx}</div>}
              {p.caption && <div className="panel-caption">{p.caption}</div>}
              {p.alert && <div className="panel-alert">{p.alert}</div>}
              {p.speech && <div className="panel-speech">{p.speech}</div>}
            </div>
          ))}
          <div className="overview-instruction">PRESS ENTER TO BEGIN</div>
        </div>
      )}

      {/* ── READING MODE: one focused panel ── */}
      {phase === 'reading' && (
        <div className="reading-mode" onClick={advance}>
          <div
            className={`focused-panel theme-${panel.theme} ${exiting ? 'exiting' : ''}`}
            style={{ backgroundImage: panel.bg ? `url(${panel.bg})` : 'none' }}
          >
            {panel.hero && <img src={HERO_IMG} alt="" className="panel-hero" />}
            {panel.location && <div className="panel-loc">{panel.location}</div>}
            {panel.narration && <div className="panel-narration">{panel.narration}</div>}
            {panel.sfx && <div className="panel-sfx">{panel.sfx}</div>}
            {panel.caption && <div className="panel-caption">{panel.caption}</div>}
            {panel.alert && <div className="panel-alert">{panel.alert}</div>}
            {panel.speech && <div className="panel-speech">{panel.speech}</div>}

            {!isLast && (
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>

          <div className="reading-nav">
            {isLast ? (
              <button 
                className="continue-btn" 
                onClick={() => {
                  playSound('/sounds/start.mp3', 0.6)
                  onComplete()
                }}
              >
                BEGIN LEVEL 2 →
              </button>
            ) : (
              <div className="reading-hint">CLICK TO ADVANCE</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
