import { useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
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

export default function Game({ onExit }) {
  const [isLocked, setIsLocked] = useState(false)
  const [nearChair, setNearChair] = useState(false)
  const [sitting, setSitting] = useState(false)
  const chairNudge = useRef({ x: 0, z: 0 })

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

        <ArcadeRoom chairNudge={chairNudge} />
        <PlayerBody />
        
        <FirstPersonControls
          onLock={() => setIsLocked(true)}
          onUnlock={() => setIsLocked(false)}
          onNearChair={setNearChair}
          onSitting={setSitting}
          chairNudge={chairNudge}
        />
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
