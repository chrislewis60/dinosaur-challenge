import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import './Game.css'
import ArcadeRoom from './ArcadeRoom'
import FirstPersonControls from './FirstPersonControls'
import PlayerBody from './PlayerBody'
import BackgroundMusic from './BackgroundMusic'
import { useSoundManager } from './useSound'

// Steady room lighting
function CeilingLights() {
  return (
    <>
      <pointLight position={[0, 2.8, 0]} intensity={1.2} castShadow />
      <pointLight position={[-4, 2, -4]} intensity={0.6} color="#ff00ff" />
      <pointLight position={[4, 2, -4]} intensity={0.6} color="#00ffff" />
      <pointLight position={[0, 1.5, 2]} intensity={0.4} color="#ffffff" />
    </>
  )
}

export default function Game({ onExit, onMissionStart, levelCompleted = false, warehouseCompleted = false, policeStationCompleted = false }) {
  const [isLocked, setIsLocked] = useState(false)
  const [nearChair, setNearChair] = useState(false)
  const [sitting, setSitting] = useState(false)
  const [missionReady, setMissionReady] = useState(false)
  const [selectedMissionIndex, setSelectedMissionIndex] = useState(0)
  const chairBodyRef = useRef()
  const missionTimerRef = useRef(null)
  const { play: playSound } = useSoundManager()

  const missionOptions = [
    { id: 'warehouse', label: 'WAREHOUSE', enabled: true },
    { id: 'police', label: 'POLICE HQ', enabled: warehouseCompleted }
  ]

  useEffect(() => {
    if (!missionOptions[1].enabled && selectedMissionIndex > 0) {
      setSelectedMissionIndex(0)
    }
  }, [missionOptions, selectedMissionIndex])

  useEffect(() => {
    if (!sitting || !missionReady) return

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setSelectedMissionIndex((prev) => {
          const nextIndex = Math.max(0, prev - 1)
          return missionOptions[nextIndex].enabled ? nextIndex : prev
        })
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setSelectedMissionIndex((prev) => {
          const nextIndex = Math.min(missionOptions.length - 1, prev + 1)
          return missionOptions[nextIndex].enabled ? nextIndex : prev
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sitting, missionReady, missionOptions])

  // Left-click while sitting + mission ready triggers the selected mission
  useEffect(() => {
    if (!sitting || !missionReady) return
    const handleMouseDown = (e) => {
      if (e.button === 0) {
        e.preventDefault()
        e.stopPropagation()
        playSound('/sounds/mission-start.mp3', 0.6)
        onMissionStart?.(selectedMissionIndex)
      }
    }
    document.addEventListener('mousedown', handleMouseDown, true) // Use capture phase
    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true)
    }
  }, [sitting, missionReady, onMissionStart, playSound, selectedMissionIndex])

  // 1.5 s loading phase, then reveal mission button
  useEffect(() => {
    if (sitting) {
      missionTimerRef.current = setTimeout(() => setMissionReady(true), 1500)
    } else {
      clearTimeout(missionTimerRef.current)
      setMissionReady(false)
    }
    return () => clearTimeout(missionTimerRef.current)
  }, [sitting])

  return (
    <div className="game-container">
      {/* Arcade background music - starts after user clicks to play */}
      <BackgroundMusic src="/music/arcade.mp3" volume={0.25} play={isLocked} />
      
      {!isLocked && (
        <div className="game-overlay">
          <div className="game-instructions">
            <h1>REX VOLTAGE</h1>
            <p className="subtitle">Underground Arcade</p>
            <div className="controls">
              <p><strong>WASD</strong> — Move</p>
              <p><strong>MOUSE</strong> — Look Around</p>
              <p><strong>ESC</strong> — Pause</p>
            </div>
            <button 
              className="start-btn"
              onClick={() => {
                playSound('/sounds/click.mp3', 0.5)
                // Trigger pointer lock to start the game
                const canvas = document.querySelector('canvas')
                if (canvas) {
                  canvas.requestPointerLock()
                }
              }}
            >
              CLICK TO START
            </button>
          </div>
        </div>
      )}
      
      {isLocked && (
        <div className="game-hud">
          <div className="hud-corner top-left">
            <div className="hud-label">REX VOLTAGE</div>
          </div>
          <div className="hud-corner top-right">
            <div className="hud-label">UNDERGROUND</div>
          </div>
          {levelCompleted && !sitting && (
            <div className="hud-corner" style={{ bottom: 120, left: '50%', transform: 'translateX(-50%)', top: 'auto' }}>
              <div className="hud-label" style={{ 
                color: '#ffcc00', 
                borderColor: '#ffcc00',
                fontSize: '18px',
                padding: '12px 24px',
                animation: 'pulse 2s ease-in-out infinite',
                background: 'rgba(255, 204, 0, 0.1)'
              }}>
                ★ LEVEL 2 AVAILABLE ★
              </div>
            </div>
          )}
          {nearChair && (
            <div className="hud-corner" style={{ bottom: 60, left: '50%', transform: 'translateX(-50%)', top: 'auto' }}>
              <div className="hud-label">{sitting ? '↓ STAND UP' : '↓ SIT DOWN'}</div>
            </div>
          )}
        </div>
      )}

      <Canvas
        camera={{ fov: 75, position: [0, 1.6, 3] }}
        style={{ background: '#0a0a0a' }}
      >
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={3} />
        <CeilingLights />

        <Physics gravity={[0, -9.81, 0]}>
          <ArcadeRoom
            chairBodyRef={chairBodyRef}
            sitting={sitting}
            missionReady={missionReady}
            selectedMissionIndex={selectedMissionIndex}
            missionOptions={missionOptions}
          />
          <PlayerBody />
          <FirstPersonControls
            onLock={() => setIsLocked(true)}
            onUnlock={() => setIsLocked(false)}
            onNearChair={setNearChair}
            onSitting={(isSitting) => {
              playSound(isSitting ? '/sounds/sit.mp3' : '/sounds/stand.mp3', 0.4)
              setSitting(isSitting)
            }}
            chairBodyRef={chairBodyRef}
          />
        </Physics>
      </Canvas>

      {isLocked && (
        <button 
          className="exit-btn"
          onClick={() => {
            playSound('/sounds/click.mp3', 0.5)
            onExit()
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          EXIT
        </button>
      )}
    </div>
  )
}
