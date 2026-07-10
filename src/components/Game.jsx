import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import './Game.css'
import ArcadeRoom from './ArcadeRoom'
import FirstPersonControls from './FirstPersonControls'
import PlayerBody from './PlayerBody'

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

export default function Game({ onExit, onMissionStart }) {
  const [isLocked, setIsLocked] = useState(false)
  const [nearChair, setNearChair] = useState(false)
  const [sitting, setSitting] = useState(false)
  const [missionReady, setMissionReady] = useState(false)
  const chairBodyRef = useRef()
  const missionTimerRef = useRef(null)

  // Left-click while sitting + mission ready triggers the mission cutscene
  useEffect(() => {
    if (!sitting || !missionReady) return
    const handleMouseDown = (e) => {
      if (e.button === 0) onMissionStart?.()
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [sitting, missionReady, onMissionStart])

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
            <button className="start-btn">CLICK TO START</button>
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
          {nearChair && (
            <div className="hud-corner" style={{ bottom: 60, left: '50%', transform: 'translateX(-50%)', top: 'auto' }}>
              <div className="hud-label">{sitting ? '\u2193 STAND UP' : '\u2193 SIT DOWN'}</div>
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
          <ArcadeRoom chairBodyRef={chairBodyRef} sitting={sitting} missionReady={missionReady} />
          <PlayerBody />
          <FirstPersonControls
            onLock={() => setIsLocked(true)}
            onUnlock={() => setIsLocked(false)}
            onNearChair={setNearChair}
            onSitting={setSitting}
            chairBodyRef={chairBodyRef}
          />
        </Physics>
      </Canvas>

      {isLocked && (
        <button 
          className="exit-btn"
          onClick={onExit}
          onPointerDown={(e) => e.stopPropagation()}
        >
          EXIT
        </button>
      )}
    </div>
  )
}
