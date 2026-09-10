import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Physics, RigidBody, CapsuleCollider } from '@react-three/rapier'
import './Game.css'
import PoliceStation from './PoliceStation'
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

// Kinematic capsule that follows the camera so Rapier can detect collisions
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

export default function PoliceStationLevel({ onExit, onComplete }) {
  const [isLocked, setIsLocked] = useState(false)
  const [caught, setCaught] = useState(false)
  const [serverNear, setServerNear] = useState(false)
  const [missionComplete, setMissionComplete] = useState(false)
  const [levelKey, setLevelKey] = useState(0)

  const playerPosRef = useRef({ x: 0, z: 20 })
  const { play: playSound } = useSoundManager()
  const wallColliders = [
    { cx: -3, cz: 0, hw: 0.5, hd: 30 },
    { cx: 3, cz: 0, hw: 0.5, hd: 30 },
    { cx: 0, cz: -30, hw: 3.0, hd: 0.5 },
  ]

  // F key — access terminal to complete mission
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'KeyF' && serverNear && isLocked && !missionComplete) {
        // Access terminal to complete mission
        playSound('/sounds/hack.mp3', 0.7)
        setTimeout(() => {
          playSound('/sounds/success.mp3', 0.8)
          setMissionComplete(true)
          // Automatically trigger completion cutscene after 1.5 seconds
          setTimeout(() => {
            onComplete?.()
          }, 1500)
        }, 500)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [serverNear, isLocked, missionComplete, playSound, onComplete])

  const restart = () => {
    setCaught(false)
    setServerNear(false)
    setMissionComplete(false)
    playerPosRef.current = { x: 0, z: 20 }
    setLevelKey(k => k + 1)
  }

  return (
    <div className="game-container">
      {/* Dark ambient music */}
      <BackgroundMusic src="/music/stealth.mp3" volume={0.2} play={isLocked} />

      {/* Pre-lock overlay */}
      {!isLocked && (
        <div className="game-overlay">
          <div className="game-instructions">
            <h1>POLICE HQ — LEVEL 2</h1>
            <p className="subtitle">Secure Government Facility</p>
            <div className="controls">
              <p><strong>WASD</strong> — Move</p>
              <p><strong>MOUSE</strong> — Look Around</p>
              <p><strong>ESC</strong> — Pause</p>
              <p><strong>SHIFT</strong> — Sprint</p>
            </div>
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
            <div className="hud-label">LEVEL 2: POLICE HQ</div>
          </div>
          <div className="hud-corner top-right">
            <div className="hud-label">CLASSIFIED</div>
          </div>
          <div className="hud-corner" style={{ bottom: 60, left: '50%', transform: 'translateX(-50%)', top: 'auto' }}>
            {serverNear
              ? <div className="hud-label" style={{ color: '#00ff88', borderColor: '#00ff88', animation: 'none' }}>PRESS F — ACCESS TERMINAL</div>
              : <div className="hud-label">OBJECTIVE: REACH THE SERVER TERMINAL</div>
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
              Security has spotted you
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
        <div className="game-overlay" style={{ background: 'rgba(0,15,0,0.94)', animation: 'fadeIn 0.5s ease-in' }}>
          <div className="game-instructions">
            <h1 style={{ color: '#00ff88', letterSpacing: 8, textShadow: '0 0 40px #00ff88' }}>
              MISSION COMPLETE!
            </h1>
            <p className="subtitle" style={{ color: 'rgba(0,255,136,0.7)' }}>
              All evidence secured from Police HQ
            </p>
            <p className="subtitle" style={{ color: 'rgba(168,218,255,0.5)', marginTop: 10 }}>
              Rex Voltage — Ghost Protocol
            </p>
          </div>
        </div>
      )}

      <Canvas
        key={levelKey}
        camera={{ fov: 75, position: [0, 1.6, 20] }}
        style={{ background: '#1a1d24' }}
      >
        <color attach="background" args={['#2a2d34']} />
        <fog attach="fog" args={['#2a2d34', 20, 50]} />

        <Physics gravity={[0, -9.81, 0]}>
          <PoliceStation
            playerPosRef={playerPosRef}
            onCaught={() => {
              playSound('/sounds/alarm.mp3', 0.6)
              setCaught(true)
            }}
            onServerNear={setServerNear}
          />
          <PlayerBody />
          <PhysicsPlayer />
          <FirstPersonControls
            onLock={() => setIsLocked(true)}
            onUnlock={() => setIsLocked(false)}
            roomBounds={35}
            furnitureCollision={false}
            staticColliders={wallColliders}
          />
          <PlayerTracker posRef={playerPosRef} />
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
