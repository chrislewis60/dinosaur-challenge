import { useState, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Physics, RigidBody, CapsuleCollider } from '@react-three/rapier'
import './Game.css'
import Warehouse from './Warehouse'
import FirstPersonControls from './FirstPersonControls'
import PlayerBody from './PlayerBody'

// Kinematic capsule that follows the camera so Rapier can push dynamic crates
function PhysicsPlayer() {
  const { camera } = useThree()
  const bodyRef = useRef()
  useFrame(() => {
    if (!bodyRef.current) return
    bodyRef.current.setNextKinematicTranslation({
      x: camera.position.x,
      y: camera.position.y - 0.8,
      z: camera.position.z,
    })
  })
  return (
    <RigidBody ref={bodyRef} type="kinematicPosition" colliders={false}>
      <CapsuleCollider args={[0.45, 0.35]} />
    </RigidBody>
  )
}

export default function WarehouseLevel({ onExit }) {
  const [isLocked, setIsLocked] = useState(false)

  // AABB boxes that block the player (cx, cz = centre; hw, hd = half-extents)
  const staticColliders = useMemo(() => [
    // Five shelf rows (depth 1.0 → hw 0.5, length 30 → hd 15, centred at z=-6)
    { cx: -22, cz: -6, hw: 0.5, hd: 15 },
    { cx: -11, cz: -6, hw: 0.5, hd: 15 },
    { cx:   0, cz: -6, hw: 0.5, hd: 15 },
    { cx:  11, cz: -6, hw: 0.5, hd: 15 },
    { cx:  22, cz: -6, hw: 0.5, hd: 15 },
    // Back-wall crate stacks
    { cx:   0, cz: -22, hw: 27, hd: 0.7 },
    // Side-wall crate stacks
    { cx: -29, cz:  -4, hw: 0.7, hd: 14 },
    { cx:  29, cz:  -4, hw: 0.7, hd: 14 },
    // Row-end floor crate piles
    { cx: -22, cz: -20, hw: 1.0, hd: 1.3 },
    { cx: -11, cz: -20, hw: 1.0, hd: 1.3 },
    { cx:   0, cz: -20, hw: 1.0, hd: 1.3 },
    { cx:  11, cz: -20, hw: 1.0, hd: 1.3 },
    { cx:  22, cz: -20, hw: 1.0, hd: 1.3 },
    // Loading dock platform
    { cx:   0, cz:  20, hw: 7.0, hd: 3.0 },
  ], [])

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
          <PhysicsPlayer />
          <PlayerBody />
          <FirstPersonControls
            onLock={() => setIsLocked(true)}
            onUnlock={() => setIsLocked(false)}
            roomBounds={27}
            furnitureCollision={false}
            staticColliders={staticColliders}
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
