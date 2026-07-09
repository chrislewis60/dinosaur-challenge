import { useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import './Game.css'
import ArcadeRoom from './ArcadeRoom'
import FirstPersonControls from './FirstPersonControls'

// Animated ceiling lights
function CeilingLights() {
  const light1Ref = useRef()
  const light2Ref = useRef()
  const light3Ref = useRef()
  
  useFrame((state) => {
    // Main light - subtle pulsing
    if (light1Ref.current) {
      light1Ref.current.intensity = 1.2 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
    // Side lights - slower alternating
    if (light2Ref.current && light3Ref.current) {
      light2Ref.current.intensity = 0.6 + Math.sin(state.clock.elapsedTime * 0.3) * 0.2
      light3Ref.current.intensity = 0.6 + Math.sin(state.clock.elapsedTime * 0.3 + Math.PI) * 0.2
    }
  })
  
  return (
    <>
      <pointLight ref={light1Ref} position={[0, 2.8, 0]} intensity={1.2} castShadow />
      <pointLight ref={light2Ref} position={[-4, 2, -4]} intensity={0.6} color="#ff00ff" />
      <pointLight ref={light3Ref} position={[4, 2, -4]} intensity={0.6} color="#00ffff" />
      <pointLight position={[0, 1.5, 2]} intensity={0.4} color="#ffffff" />
    </>
  )
}

export default function Game({ onExit }) {
  const [isLocked, setIsLocked] = useState(false)

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
        </div>
      )}

      <Canvas
        shadows
        camera={{ fov: 75, position: [0, 1.6, 3] }}
        style={{ background: '#0a0a0a' }}
      >
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.5} />
        <CeilingLights />

        <ArcadeRoom />
        
        <FirstPersonControls
          onLock={() => setIsLocked(true)}
          onUnlock={() => setIsLocked(false)}
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
