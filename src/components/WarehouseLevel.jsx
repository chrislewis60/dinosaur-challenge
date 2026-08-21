import { useState, useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Physics, RigidBody, CapsuleCollider } from '@react-three/rapier'
import './Game.css'
import Warehouse from './Warehouse'
import FirstPersonControls from './FirstPersonControls'
import PlayerBody from './PlayerBody'
import BackgroundMusic from './BackgroundMusic'
import { useSoundManager } from './useSound'

// Writes camera position into a shared ref every frame
function PlayerTracker({ posRef }) {
  const { camera } = useThree()
  useFrame(() => {
    posRef.current.x = camera.position.x
    posRef.current.z = camera.position.z
  })
  return null
}

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
  const [isLocked,       setIsLocked]       = useState(false)
  const [caught,         setCaught]         = useState(false)
  const [serverNear,     setServerNear]     = useState(false)
  const [nearDoor,       setNearDoor]       = useState(false)
  const [lockPicked,     setLockPicked]     = useState(false)
  const [lockProgress,   setLockProgress]   = useState(0)
  const [missionComplete,setMissionComplete]= useState(false)
  const [levelKey,       setLevelKey]       = useState(0)

  const playerPosRef = useRef({ x: 0, z: 18 })
  const fHeldRef     = useRef(false)
  const { play: playSound } = useSoundManager()
  const lockSoundPlayingRef = useRef(false)

  // Track F key held state
  useEffect(() => {
    const dn = (e) => { if (e.code === 'KeyF') fHeldRef.current = true  }
    const up = (e) => { if (e.code === 'KeyF') fHeldRef.current = false }
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup',   up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [])

  // Hold-F lock-picking progress (fills while held, drains when released)
  useEffect(() => {
    if (lockPicked) return
    
    let lockPickInterval = null
    
    const tick = setInterval(() => {
      if (!nearDoor || caught) {
        lockSoundPlayingRef.current = false
        if (lockPickInterval) {
          clearInterval(lockPickInterval)
          lockPickInterval = null
        }
        return
      }
      setLockProgress(prev => {
        const next = fHeldRef.current
          ? Math.min(100, prev + 2)   // ~5 s to fill
          : Math.max(0,   prev - 1.2) // drains if released
        
        // Play lock picking sound continuously while holding F
        if (fHeldRef.current && !lockSoundPlayingRef.current) {
          playSound('/sounds/door-lock.mp3', 0.4)
          lockSoundPlayingRef.current = true
          // Play the sound every 0.8 seconds for continuous feedback
          lockPickInterval = setInterval(() => {
            if (fHeldRef.current) {
              playSound('/sounds/door-lock.mp3', 0.4)
            }
          }, 800)
        } else if (!fHeldRef.current) {
          lockSoundPlayingRef.current = false
          if (lockPickInterval) {
            clearInterval(lockPickInterval)
            lockPickInterval = null
          }
        }
        
        if (next >= 100) {
          playSound('/sounds/door-open.mp3', 0.6)
          setLockPicked(true)
          if (lockPickInterval) {
            clearInterval(lockPickInterval)
            lockPickInterval = null
          }
        }
        return next
      })
    }, 100)
    
    return () => {
      clearInterval(tick)
      if (lockPickInterval) {
        clearInterval(lockPickInterval)
      }
    }
  }, [nearDoor, lockPicked, caught, playSound])

  // F key — hack terminal (only when already inside)
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'KeyF' && serverNear && isLocked && !missionComplete && lockPicked) {
        playSound('/sounds/hack.mp3', 0.7)
        setTimeout(() => {
          playSound('/sounds/success.mp3', 0.8)
          setMissionComplete(true)
        }, 500)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [serverNear, isLocked, missionComplete, lockPicked, playSound])

  const restart = () => {
    setCaught(false)
    setServerNear(false)
    setNearDoor(false)
    setLockPicked(false)
    setLockProgress(0)
    setMissionComplete(false)
    setLevelKey(k => k + 1)
    lockSoundPlayingRef.current = false
  }

  // AABB boxes that block the player (cx, cz = centre; hw, hd = half-extents)
  // Shelf platforms — each board is a surface Rex can land and walk on
  // ShelfRow boards are at LEVELS [0.42, 1.38, 2.34, 3.30, 4.18]; top = level + 0.035
  const platforms = useMemo(() => {
    const LEVELS   = [0.455, 1.415, 2.375, 3.335, 4.215]
    const ROW_X    = [-22, -11, 0, 11, 22]
    return ROW_X.flatMap(cx =>
      LEVELS.map(surfaceY => ({
        cx, cz: -6, hw: 0.48, hd: 14.9, surfaceY
      }))
    )
  }, [])

  const staticColliders = useMemo(() => [
    // Shelf rows — AABB removed; players can now walk onto shelves from the ends
    // (platforms array above handles standing on each board level)
    // Back-wall crate stacks — gap at x=-4..4 for the server room doorway
    { cx: -15.5, cz: -22, hw: 11.5, hd: 0.7 },
    { cx:  15.5, cz: -22, hw: 11.5, hd: 0.7 },
    // Side-wall crate stacks
    { cx: -29, cz:  -4, hw: 0.7, hd: 14 },
    { cx:  29, cz:  -4, hw: 0.7, hd: 14 },
    // Row-end floor crate piles
    { cx: -22, cz: -20, hw: 1.0, hd: 1.3 },
    { cx: -11, cz: -20, hw: 1.0, hd: 1.3 },
    { cx:   0, cz: -20, hw: 1.0, hd: 1.3 },
    { cx:  11, cz: -20, hw: 1.0, hd: 1.3 },
    { cx:  22, cz: -20, hw: 1.0, hd: 1.3 },
    // Loading dock
    { cx:   0, cz:  20, hw: 7.0, hd: 3.0 },
    // Back wall — left and right of the server room doorway
    { cx: -16.25, cz: -24, hw: 13.75, hd: 0.2 },
    { cx:  16.25, cz: -24, hw: 13.75, hd: 0.2 },
    // Server room door — removed once lock is picked
    ...(!lockPicked ? [{ cx: 0, cz: -24.1, hw: 2.5, hd: 0.12 }] : []),
    // Server room walls
    { cx:  -7, cz: -29, hw: 0.2, hd: 5.2 },
    { cx:   7, cz: -29, hw: 0.2, hd: 5.2 },
    { cx:   0, cz: -34, hw: 7.2, hd: 0.2 },
  ], [lockPicked])

  return (
    <div className="game-container">
      {/* Tense warehouse background music - starts after user clicks to play */}
      <BackgroundMusic src="/music/warehouse.mp3" volume={0.3} play={isLocked && !missionComplete} />
      
      {/* Start screen */}
      {!isLocked && !caught && !missionComplete && (
        <div className="game-overlay">
          <div className="game-instructions">
            <h1>WAREHOUSE DISTRICT</h1>
            <p className="subtitle">OmniArc Storage — Sector 7</p>
            <div className="controls">
              <p><strong>WASD</strong> — Move</p>
              <p><strong>MOUSE</strong> — Look Around</p>
              <p><strong>SPACE</strong> — Jump</p>
              <p><strong>F</strong> — Interact</p>
              <p><strong>ESC</strong> — Pause</p>
            </div>
            <p className="subtitle" style={{ color: 'rgba(255,80,80,0.7)', marginTop: 10 }}>
              Avoid the guards — reach the server room
            </p>
            <button 
              className="start-btn"
              onClick={() => {
                playSound('/sounds/click.mp3', 0.5)
                setIsLocked(true)
              }}
            >
              CLICK TO ENTER
            </button>
          </div>
        </div>
      )}

      {/* Playing HUD */}
      {isLocked && !caught && !missionComplete && (
        <div className="game-hud">
          <div className="hud-corner top-left">
            <div className="hud-label">WAREHOUSE DISTRICT</div>
          </div>
          <div className="hud-corner top-right">
            <div className="hud-label">SECTOR 7</div>
          </div>
          <div className="hud-corner" style={{ bottom: 60, left: '50%', transform: 'translateX(-50%)', top: 'auto' }}>
            {serverNear && lockPicked
              ? <div className="hud-label" style={{ color: '#00ff88', borderColor: '#00ff88', animation: 'none' }}>PRESS F — HACK TERMINAL</div>
              : nearDoor && !lockPicked
              ? <div style={{ textAlign: 'center' }}>
                  <div className="hud-label">HOLD F — PICK LOCK</div>
                  <div style={{ width: 200, height: 5, background: 'rgba(255,255,255,0.15)', marginTop: 6, borderRadius: 2 }}>
                    <div style={{ width: `${lockProgress}%`, height: '100%', background: '#ffcc00', borderRadius: 2, transition: 'none' }} />
                  </div>
                </div>
              : lockPicked
              ? <div className="hud-label" style={{ color: '#00ff88', borderColor: '#00ff88' }}>LOCK BROKEN — FIND THE TERMINAL</div>
              : <div className="hud-label">OBJECTIVE: FIND THE SERVER ROOM</div>
            }
          </div>
        </div>
      )}

      {/* Caught overlay */}
      {caught && (
        <div className="game-overlay" style={{ background: 'rgba(180,0,0,0.88)' }}>
          <div className="game-instructions">
            <h1 style={{ color: '#fff', letterSpacing: 12, textShadow: '0 0 40px #ff0000' }}>DETECTED!</h1>
            <p className="subtitle" style={{ color: 'rgba(255,180,180,0.8)' }}>
              OmniArc Security has spotted you
            </p>
            <button
              className="start-btn"
              style={{ marginTop: 28, color: '#fff', borderColor: 'rgba(255,255,255,0.6)' }}
              onClick={() => {
                playSound('/sounds/click.mp3', 0.5)
                restart()
              }}
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Mission complete overlay */}
      {missionComplete && (
        <div className="game-overlay" style={{ background: 'rgba(0,15,0,0.94)' }}>
          <div className="game-instructions">
            <h1 style={{ color: '#00ff88', letterSpacing: 8, textShadow: '0 0 40px #00ff88' }}>
              SCORES RESTORED!
            </h1>
            <p className="subtitle" style={{ color: 'rgba(0,255,136,0.7)' }}>
              Every score. Every legend. Back online.
            </p>
            <p className="subtitle" style={{ color: 'rgba(168,218,255,0.5)', marginTop: 10 }}>
              Rex Voltage — Undefeated Champion
            </p>
            <button
              className="start-btn"
              style={{ marginTop: 28, color: '#00ff88', borderColor: '#00ff88' }}
              onClick={() => {
                playSound('/sounds/click.mp3', 0.5)
                onExit()
              }}
            >
              RETURN TO ARCADE
            </button>
          </div>
        </div>
      )}

      <Canvas
        key={levelKey}
        camera={{ fov: 75, position: [0, 1.6, 18] }}
        style={{ background: '#0a0a0a' }}
      >
        <ambientLight intensity={0.3} />
        <Physics gravity={[0, -9.81, 0]}>
          <Warehouse
            playerPosRef={playerPosRef}
            onCaught={() => {
              playSound('/sounds/alarm.mp3', 0.7)
              setCaught(true)
            }}
            onServerNear={setServerNear}
            onNearDoor={setNearDoor}
            lockPicked={lockPicked}
          />
          <PhysicsPlayer />
          <PlayerTracker posRef={playerPosRef} />
          <PlayerBody />
          <FirstPersonControls
            onLock={() => setIsLocked(true)}
            onUnlock={() => setIsLocked(false)}
            roomBounds={33}
            furnitureCollision={false}
            staticColliders={staticColliders}
            platforms={platforms}
          />
        </Physics>
      </Canvas>

      {isLocked && !caught && !missionComplete && (
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
