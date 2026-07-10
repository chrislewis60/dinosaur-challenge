import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import './Game.css'
import Warehouse from './Warehouse'
import FirstPersonControls from './FirstPersonControls'
import PlayerBody from './PlayerBody'

export default function WarehouseLevel({ onExit }) {
  const [isLocked, setIsLocked] = useState(false)

  return (
    <div className="game-container">
      {!isLocked && (
        <div className="game-overlay">
          <div className="game-instructions">
            <h1>WAREHOUSE DISTRICT</h1>
            <p className="subtitle">OmniArc Storage — Sector 7</p>
            <div className="controls">
              <p><strong>WASD</strong> — Move</p>
              <p><strong>MOUSE</strong> — Look Around</p>
              <p><strong>SPACE</strong> — Jump</p>
              <p><strong>ESC</strong> — Pause</p>
            </div>
            <button className="start-btn">CLICK TO ENTER</button>
          </div>
        </div>
      )}

      {isLocked && (
        <div className="game-hud">
          <div className="hud-corner top-left">
            <div className="hud-label">WAREHOUSE DISTRICT</div>
          </div>
          <div className="hud-corner top-right">
            <div className="hud-label">SECTOR 7</div>
          </div>
          <div className="hud-corner" style={{ bottom: 60, left: '50%', transform: 'translateX(-50%)', top: 'auto' }}>
            <div className="hud-label">OBJECTIVE: FIND OMNI-ARC SERVERS</div>
          </div>
        </div>
      )}

      <Canvas
        camera={{ fov: 75, position: [0, 1.6, 18] }}
        style={{ background: '#0a0a0a' }}
      >
        <ambientLight intensity={0.3} />
        <Physics gravity={[0, -9.81, 0]}>
          <Warehouse />
          <PlayerBody />
          <FirstPersonControls
            onLock={() => setIsLocked(true)}
            onUnlock={() => setIsLocked(false)}
            roomBounds={27}
            furnitureCollision={false}
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
