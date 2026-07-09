import { useState } from 'react'
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
    hero: false,
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
    hero: false,
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
    hero: false,
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
    hero: false,
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
  const [current, setCurrent] = useState(0)
  const [exiting, setExiting] = useState(false)

  const goTo = (index) => {
    if (exiting || index === current) return
    setExiting(true)
    setTimeout(() => {
      setCurrent(index)
      setExiting(false)
    }, 260)
  }

  const advance = () => {
    if (current < PANELS.length - 1) goTo(current + 1)
  }

  const panel = PANELS[current]
  const isLast = current === PANELS.length - 1

  return (
    <div className="cutscene-screen">
      <div className="cutscene-header">
        <div>
          <span className="cutscene-logo">REX VOLTAGE</span>
          <span className="cutscene-subtitle">vs the OmniArc</span>
        </div>
        <button className="skip-btn" onClick={onStart}>
          SKIP ▶
        </button>
      </div>

      <div
        className={`comic-panel theme-${panel.theme} ${exiting ? 'panel-exit' : 'panel-enter'}`}
        onClick={isLast ? undefined : advance}
        style={panel.bg ? { '--panel-bg': `url(${panel.bg})` } : {}}
      >
        {panel.bg && <div className="panel-bg-img" />}
        <div className="panel-color-overlay" />
        <div className="panel-halftone" />

        {panel.location && (
          <div className="caption-box location-cap">{panel.location}</div>
        )}

        {panel.sfx && <div className="sfx-word">{panel.sfx}</div>}

        {panel.alert && (
          <div className="alert-box">
            <pre>{panel.alert}</pre>
          </div>
        )}

        {panel.hero && (
          <img
            src={HERO_IMG}
            alt="Rex Voltage"
            className="hero-portrait"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMG
            }}
          />
        )}

        {panel.narration && (
          <div className="narration-box">{panel.narration}</div>
        )}

        {panel.speech && (
          <div className="speech-bubble">
            {panel.speech.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}

        {panel.caption && (
          <div className="caption-box bottom-cap">{panel.caption}</div>
        )}

        {isLast ? (
          <button
            className="start-btn"
            onClick={(e) => {
              e.stopPropagation()
              onStart()
            }}
          >
            ⚡ PLAY AS REX VOLTAGE ⚡
          </button>
        ) : (
          <div className="tap-hint">click to continue</div>
        )}
      </div>

      <div className="panel-nav">
        {PANELS.map((p, i) => (
          <button
            key={p.id}
            className={`nav-dot ${i === current ? 'active' : i < current ? 'visited' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to panel ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
