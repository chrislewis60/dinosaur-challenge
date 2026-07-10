import { useTexture, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'

// ── Dirty texture generators ──────────────────────────────────────────────────

function makeDirtyFloor() {
  const s = 512, c = document.createElement('canvas')
  c.width = s; c.height = s
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#565450'; ctx.fillRect(0, 0, s, s)
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * s, y = Math.random() * s
    ctx.beginPath(); ctx.ellipse(x, y, Math.random() * 70 + 20, Math.random() * 50 + 15, Math.random() * Math.PI, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(90,88,84,${0.15 + Math.random() * 0.2})`; ctx.fill()
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1
  for (let i = 0; i < s; i += 80) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke()
  }
  for (let i = 0; i < 22; i++) {
    ctx.beginPath()
    let x = Math.random() * s, y = Math.random() * s; ctx.moveTo(x, y)
    for (let j = 0; j < 4; j++) { x += (Math.random() - 0.5) * 60; y += (Math.random() - 0.5) * 60; ctx.lineTo(x, y) }
    ctx.strokeStyle = `rgba(20,18,15,${0.3 + Math.random() * 0.35})`; ctx.lineWidth = Math.random() * 0.8 + 0.2; ctx.stroke()
  }
  [[0,0],[s,0],[0,s],[s,s]].forEach(([cx,cy]) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.5)
    g.addColorStop(0, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s)
  })
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 3); return tex
}

function makeDirtyWall() {
  const s = 512, c = document.createElement('canvas')
  c.width = s; c.height = s
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#4a4740'; ctx.fillRect(0, 0, s, s)
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * s, y = Math.random() * s
    ctx.beginPath(); ctx.ellipse(x, y, Math.random() * 80 + 30, Math.random() * 60 + 20, Math.random() * Math.PI, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(80,76,68,${0.15 + Math.random() * 0.2})`; ctx.fill()
  }
  for (let i = 0; i < 30; i++) {
    ctx.beginPath()
    let x = Math.random() * s, y = Math.random() * s; ctx.moveTo(x, y)
    for (let j = 0; j < 4; j++) { x += (Math.random() - 0.5) * 50; y += (Math.random() - 0.5) * 50; ctx.lineTo(x, y) }
    ctx.strokeStyle = `rgba(20,18,15,${0.3 + Math.random() * 0.4})`; ctx.lineWidth = Math.random() * 0.8 + 0.2; ctx.stroke()
  }
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * s, y = Math.random() * s
    ctx.beginPath(); ctx.ellipse(x, y, Math.random() * 14 + 3, Math.random() * 10 + 2, Math.random() * Math.PI, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(90,86,78,${0.3 + Math.random() * 0.3})`; ctx.fill()
  }
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * s, y = Math.random() * s, r = Math.random() * 80 + 40
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(200,185,130,${0.04 + Math.random() * 0.04})`); g.addColorStop(1, 'rgba(200,185,130,0)')
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
  }
  const topGrad = ctx.createLinearGradient(0, 0, 0, 80)
  topGrad.addColorStop(0, 'rgba(0,0,0,0.35)'); topGrad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = topGrad; ctx.fillRect(0, 0, s, 80)
  const botGrad = ctx.createLinearGradient(0, s - 80, 0, s)
  botGrad.addColorStop(0, 'rgba(0,0,0,0)'); botGrad.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = botGrad; ctx.fillRect(0, s - 80, s, 80)
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 1); return tex
}

function makeDirtyCeiling() {
  const s = 512, c = document.createElement('canvas')
  c.width = s; c.height = s
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#1e1d1b'; ctx.fillRect(0, 0, s, s)
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * s, y = Math.random() * s
    ctx.beginPath(); ctx.ellipse(x, y, Math.random() * 90 + 30, Math.random() * 70 + 20, Math.random() * Math.PI, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(45,43,40,${0.2 + Math.random() * 0.25})`; ctx.fill()
  }
  for (let i = 0; i < 28; i++) {
    ctx.beginPath()
    let x = Math.random() * s, y = Math.random() * s; ctx.moveTo(x, y)
    for (let j = 0; j < 5; j++) { x += (Math.random() - 0.5) * 55; y += (Math.random() - 0.5) * 55; ctx.lineTo(x, y) }
    ctx.strokeStyle = `rgba(8,7,5,${0.4 + Math.random() * 0.4})`; ctx.lineWidth = Math.random() * 0.7 + 0.2; ctx.stroke()
  }
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * s, y = Math.random() * s, r = Math.random() * 60 + 25
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(180,165,120,${0.04 + Math.random() * 0.04})`); g.addColorStop(1, 'rgba(180,165,120,0)')
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
  }
  [[0,0],[s,0],[0,s],[s,s]].forEach(([cx,cy]) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.5)
    g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s)
  })
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 3); return tex
}

// ── Ceiling light fixture ─────────────────────────────────────────────────────

function CeilingLight({ position, color = '#fff8e7', intensity = 2.5 }) {
  const spotRef = useRef()
  return (
    <group position={position}>
      <mesh><cylinderGeometry args={[0.12, 0.12, 0.04, 16]} /><meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} /></mesh>
      <mesh position={[0, -0.2, 0]}><cylinderGeometry args={[0.01, 0.01, 0.4, 8]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[0, -0.5, 0]}><coneGeometry args={[0.18, 0.22, 16, 1, true]} /><meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -0.44, 0]}><sphereGeometry args={[0.07, 16, 16]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} /></mesh>
      <spotLight ref={spotRef} position={[0, -0.5, 0]} angle={0.55} penumbra={0.5} intensity={intensity} color={color} distance={6} />
      <pointLight position={[0, -0.5, 0]} color={color} intensity={0.4} distance={3} />
    </group>
  )
}

// ── Room props ────────────────────────────────────────────────────────────────

function drawCenterMonitor(canvas, sitting, missionReady) {
  const ctx = canvas.getContext('2d')
  const W = 860, H = 510
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#020812'
  ctx.fillRect(0, 0, W, H)

  if (!sitting) {
    ctx.fillStyle = 'rgba(0, 255, 65, 0.55)'
    ctx.font = '16px "Share Tech Mono", monospace'
    ctx.fillText('> SYSTEM READY_', 30, 70)
    return
  }

  // Shared header
  ctx.fillStyle = 'rgba(120, 200, 255, 0.45)'
  ctx.font = '18px "Share Tech Mono", monospace'
  ctx.fillText('> OMNI-ARC TERMINAL v2.087', 30, 48)
  ctx.strokeStyle = 'rgba(120, 200, 255, 0.18)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(30, 62); ctx.lineTo(830, 62); ctx.stroke()

  if (!missionReady) {
    ctx.fillStyle = '#a8daff'
    ctx.font = '24px "Share Tech Mono", monospace'
    ctx.fillText('AUTHENTICATING...', 30, 135)
    ctx.fillText('SCANNING ARCADE RECORDS...', 30, 178)
    ctx.fillText('LOADING MISSION DATA..._', 30, 221)
    ctx.strokeStyle = 'rgba(120, 200, 255, 0.25)'
    ctx.lineWidth = 2
    ctx.strokeRect(30, 268, 800, 10)
    ctx.shadowBlur = 10; ctx.shadowColor = '#a8daff'
    ctx.fillStyle = 'rgba(120, 200, 255, 0.6)'
    ctx.fillRect(30, 268, 500, 10)
    ctx.shadowBlur = 0
  } else {
    ctx.textAlign = 'center'
    ctx.fillStyle = '#a8daff'
    ctx.font = 'bold 36px "Exo 2", sans-serif'
    ctx.shadowBlur = 24; ctx.shadowColor = 'rgba(120, 200, 255, 0.9)'
    ctx.fillText('!! MISSION AVAILABLE !!', W / 2, 165)
    ctx.shadowBlur = 0
    // button border
    ctx.strokeStyle = 'rgba(120, 200, 255, 0.55)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(W / 2 - 350, 255, 700, 74)
    ctx.fillStyle = 'rgba(120, 200, 255, 0.05)'
    ctx.fillRect(W / 2 - 350, 255, 700, 74)
    // button text
    ctx.fillStyle = '#a8daff'
    ctx.font = 'bold 21px "Exo 2", sans-serif'
    ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(120,200,255,0.6)'
    ctx.fillText('\u25b6  START MISSION', W / 2, 300)
    ctx.shadowBlur = 0
    // subtitle
    ctx.font = '22px "Share Tech Mono", monospace'
    ctx.fillStyle = 'rgba(120, 200, 255, 0.65)'
    ctx.fillText('GET EVERY HIGH SCORE BACK', W / 2, 372)
    ctx.font = '13px "Share Tech Mono", monospace'
    ctx.fillStyle = 'rgba(120, 200, 255, 0.3)'
    ctx.fillText('RIGHT-CLICK TO START MISSION', W / 2, 440)
    ctx.textAlign = 'left'
  }
}

function GamingDesk({ position, rotation = [0, 0, 0], sitting = false, missionReady = false }) {
  const centerCanvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 860; c.height = 510
    return c
  }, [])
  const centerTex = useMemo(() => new THREE.CanvasTexture(centerCanvas), [centerCanvas])

  useEffect(() => {
    drawCenterMonitor(centerCanvas, sitting, missionReady)
    centerTex.needsUpdate = true
  }, [sitting, missionReady, centerCanvas, centerTex])

  return (
    <group position={position} rotation={rotation}>
      {/* Rounded desk surface */}
      <RoundedBox position={[0, 0.78, 0]} args={[2.4, 0.06, 0.85]} radius={0.025} castShadow receiveShadow>
        <meshStandardMaterial color="#0e0e0e" roughness={0.45} metalness={0.45} />
      </RoundedBox>

      {/* Metal U-frame legs — left and right */}
      {[-1.05, 1.05].map(x => (
        <group key={x} position={[x, 0, 0]}>
          {[-0.36, 0.36].map(z => (
            <mesh key={z} position={[0, 0.38, z]} castShadow>
              <cylinderGeometry args={[0.024, 0.024, 0.76, 12]} />
              <meshStandardMaterial color="#2a2a2a" metalness={0.75} roughness={0.25} />
            </mesh>
          ))}
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.05, 0.04, 0.78]} />
            <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* Rear cross-brace */}
      <mesh position={[0, 0.05, -0.36]} castShadow>
        <boxGeometry args={[2.2, 0.03, 0.04]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Centre monitor — green hacker terminal */}
      <group position={[0, 1.25, -0.28]}>
        <RoundedBox args={[0.92, 0.56, 0.04]} radius={0.015} castShadow>
          <meshStandardMaterial color="#0d0d0d" roughness={0.2} metalness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.026]}><boxGeometry args={[0.86, 0.51, 0.01]} /><meshStandardMaterial map={centerTex} roughness={0.85} metalness={0} /></mesh>
        <mesh position={[0, -0.35, 0.08]}><cylinderGeometry args={[0.03, 0.04, 0.16, 10]} /><meshStandardMaterial color="#222" metalness={0.5} /></mesh>
        <pointLight position={[0, 0, 0.4]} color={sitting ? '#a8daff' : '#00ff41'} intensity={sitting ? 2.0 : 1.2} distance={2.5} />
      </group>

      {/* Left monitor */}
      <group position={[-0.78, 1.2, -0.22]} rotation={[0, 0.38, 0]}>
        <RoundedBox args={[0.72, 0.46, 0.04]} radius={0.012} castShadow>
          <meshStandardMaterial color="#0d0d0d" roughness={0.2} metalness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.026]}><boxGeometry args={[0.66, 0.41, 0.01]} /><meshStandardMaterial color={sitting ? '#cce4ff' : '#000'} emissive={sitting ? '#cce4ff' : '#000000'} emissiveIntensity={sitting ? 0.85 : 0} roughness={0.85} metalness={0} /></mesh>
        <pointLight position={[0, 0, 0.3]} color={sitting ? '#cce4ff' : '#0055ff'} intensity={sitting ? 1.2 : 0.7} distance={2} />
      </group>

      {/* Right monitor */}
      <group position={[0.78, 1.2, -0.22]} rotation={[0, -0.38, 0]}>
        <RoundedBox args={[0.72, 0.46, 0.04]} radius={0.012} castShadow>
          <meshStandardMaterial color="#0d0d0d" roughness={0.2} metalness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.026]}><boxGeometry args={[0.66, 0.41, 0.01]} /><meshStandardMaterial color={sitting ? '#cce4ff' : '#000'} emissive={sitting ? '#cce4ff' : '#000000'} emissiveIntensity={sitting ? 0.85 : 0} roughness={0.85} metalness={0} /></mesh>
        <pointLight position={[0, 0, 0.3]} color={sitting ? '#cce4ff' : '#ff2200'} intensity={sitting ? 1.2 : 0.5} distance={2} />
      </group>

      {/* RGB keyboard */}
      <RoundedBox position={[0, 0.785, 0.15]} args={[0.48, 0.018, 0.16]} radius={0.008} rotation={[0.08, 0, 0]} castShadow>
        <meshStandardMaterial color="#080808" roughness={0.45} emissive="#ff00ff" emissiveIntensity={0.12} />
      </RoundedBox>
      {/* Mouse */}
      <RoundedBox position={[0.34, 0.783, 0.14]} args={[0.06, 0.022, 0.1]} radius={0.01} castShadow>
        <meshStandardMaterial color="#111" roughness={0.35} metalness={0.2} />
      </RoundedBox>
      {/* Mouse pad */}
      <mesh position={[0.25, 0.779, 0.14]}>
        <boxGeometry args={[0.28, 0.005, 0.22]} />
        <meshStandardMaterial color="#1a0030" roughness={0.95} />
      </mesh>

      {/* PC tower */}
      <group position={[-0.92, 0.32, 0.22]}>
        <RoundedBox args={[0.22, 0.48, 0.44]} radius={0.015} castShadow>
          <meshStandardMaterial color="#090909" roughness={0.6} metalness={0.2} />
        </RoundedBox>
        <mesh position={[0.12, 0, 0]}>
          <boxGeometry args={[0.005, 0.44, 0.4]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.5} transparent opacity={0.9} />
        </mesh>
        <pointLight position={[0.25, 0, 0]} color="#00ffff" intensity={0.5} distance={1.2} />
      </group>

      {/* Headphones */}
      <group position={[-0.4, 0.8, 0.32]}>
        <mesh castShadow><torusGeometry args={[0.08, 0.015, 10, 24, Math.PI]} /><meshStandardMaterial color="#1a1a1a" roughness={0.35} metalness={0.3} /></mesh>
        {[-0.08, 0.08].map(x => (
          <mesh key={x} position={[x, -0.05, 0]} castShadow>
            <cylinderGeometry args={[0.032, 0.032, 0.022, 14]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* Sticky note */}
      <mesh position={[0.55, 0.784, 0.08]} rotation={[0, 0.2, 0.04]}>
        <boxGeometry args={[0.14, 0.004, 0.1]} />
        <meshStandardMaterial color="#ffd700" roughness={1} emissive="#ffd700" emissiveIntensity={0.05} />
      </mesh>
    </group>
  )
}

function GamingChair({ position, rotation = [0, 0, 0], bodyRef }) {
  return (
    <RigidBody
      ref={bodyRef}
      type="dynamic"
      position={position}
      rotation={rotation}
      lockRotations
      linearDamping={10}
      angularDamping={10}
      friction={1.2}
      restitution={0}
    >
      {/* Collider covering seat + backrest — high density makes it heavy */}
      <CuboidCollider args={[0.3, 0.87, 0.32]} position={[0, 0.87, -0.12]} density={40} />
      {/* Collider covering the star base */}
      <CuboidCollider args={[0.46, 0.06, 0.46]} position={[0, 0.06, 0]} density={40} />
    <group rotation={[0, 0, 0]}>
      {/* Seat cushion */}
      <RoundedBox position={[0, 0.48, 0]} args={[0.58, 0.1, 0.56]} radius={0.04} castShadow>
        <meshStandardMaterial color="#150a0a" roughness={0.85} />
      </RoundedBox>
      {/* Seat cushion top softening */}
      <mesh position={[0, 0.54, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.27, 0.04, 20]} />
        <meshStandardMaterial color="#100808" roughness={0.9} />
      </mesh>

      {/* Back panel */}
      <RoundedBox position={[0, 1.08, -0.26]} rotation={[-0.08, 0, 0]} args={[0.58, 1.0, 0.1]} radius={0.035} castShadow>
        <meshStandardMaterial color="#150a0a" roughness={0.85} />
      </RoundedBox>
      {/* Lumbar support bump */}
      <mesh position={[0, 0.78, -0.22]} rotation={[-0.08, 0, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.055, 20]} />
        <meshStandardMaterial color="#cc0000" roughness={0.65} />
      </mesh>

      {/* Headrest */}
      <RoundedBox position={[0, 1.63, -0.28]} args={[0.36, 0.22, 0.1]} radius={0.04} castShadow>
        <meshStandardMaterial color="#cc0000" roughness={0.65} />
      </RoundedBox>

      {/* Armrests */}
      {[-0.36, 0.36].map(x => (
        <group key={x} position={[x, 0.62, -0.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.024, 0.024, 0.22, 12]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.65} roughness={0.28} />
          </mesh>
          <RoundedBox position={[0, 0.15, 0]} args={[0.1, 0.04, 0.3]} radius={0.018} castShadow>
            <meshStandardMaterial color="#111" roughness={0.7} />
          </RoundedBox>
        </group>
      ))}

      {/* Gas lift */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.038, 0.048, 0.44, 14]} />
        <meshStandardMaterial color="#888" metalness={0.85} roughness={0.18} />
      </mesh>

      {/* 5-spoke star base */}
      {[0, 1.257, 2.513, 3.77, 5.027].map((angle, i) => (
        <group key={i} rotation={[0, angle, 0]}>
          <mesh position={[0.22, 0.04, 0]} castShadow>
            <boxGeometry args={[0.44, 0.038, 0.055]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.55} roughness={0.4} />
          </mesh>
          {/* Caster wheel */}
          <mesh position={[0.42, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.055, 12]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
    </RigidBody>
  )
}

function ServerRack({ position }) {
  return (
    <group position={position}>
      <mesh castShadow><boxGeometry args={[0.6, 1.8, 0.5]} /><meshStandardMaterial color="#0a0a0a" roughness={0.6} metalness={0.5} /></mesh>
      {[0.7, 0.5, 0.3, 0.1, -0.1, -0.3, -0.5].map((y, i) => (
        <group key={y} position={[0, y, 0.22]}>
          <mesh><boxGeometry args={[0.54, 0.14, 0.06]} /><meshStandardMaterial color="#111" roughness={0.5} metalness={0.4} /></mesh>
          <mesh position={[0.22, 0, 0.04]}>
            <sphereGeometry args={[0.012, 6, 6]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#00ff00' : '#ff8800'} emissive={i % 2 === 0 ? '#00ff00' : '#ff8800'} emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 0, 0.4]} color="#00ff00" intensity={0.4} distance={1.5} />
    </group>
  )
}

// ── Main Room ─────────────────────────────────────────────────────────────────

export default function ArcadeRoom({ chairBodyRef, sitting = false, missionReady = false }) {
  const wallTexture = useTexture('/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_2.png')
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping
  wallTexture.repeat.set(1.5, 1)

  const dirtyFloor   = useMemo(() => makeDirtyFloor(),   [])
  const dirtyWall    = useMemo(() => makeDirtyWall(),    [])
  const dirtyCeiling = useMemo(() => makeDirtyCeiling(), [])

  return (
    <group>
      {/* 5 ceiling lights covering the whole room */}
      <CeilingLight position={[0, 3, 0]}     intensity={20} color="#fff8e7" />
      <CeilingLight position={[-3, 3, -3.5]} intensity={16} color="#fff8e7" />
      <CeilingLight position={[3, 3, -3.5]}  intensity={16} color="#fff8e7" />
      <CeilingLight position={[-3, 3, 2.5]}  intensity={16} color="#fff8e7" />
      <CeilingLight position={[3, 3, 2.5]}   intensity={16} color="#fff8e7" />

      {/* ── FLOOR ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial map={dirtyFloor} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* ── CEILING ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial map={dirtyCeiling} roughness={1} metalness={0} />
      </mesh>

      {/* ── BACK WALL ── */}
      <mesh position={[0, 1.5, -5]} receiveShadow>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshStandardMaterial map={dirtyWall} roughness={0.95} metalness={0.02} />
      </mesh>
      <mesh position={[0, 1.5, -4.95]}>
        <planeGeometry args={[2.5, 1.5]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>

      {/* ── LEFT WALL ── */}
      <mesh position={[-5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshStandardMaterial map={dirtyWall} roughness={0.95} metalness={0.02} />
      </mesh>

      {/* ── RIGHT WALL ── */}
      <mesh position={[5, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshStandardMaterial map={dirtyWall} roughness={0.95} metalness={0.02} />
      </mesh>

      {/* ── GAMING DESK & CHAIR ── */}
      <GamingDesk position={[0, 0, -3.8]} sitting={sitting} missionReady={missionReady} />
      <GamingChair position={[0, 0, -2.6]} rotation={[0, Math.PI, 0]} bodyRef={chairBodyRef} />

      {/* ── SERVER RACK — left corner ── */}
      <ServerRack position={[-4.3, 0.9, -3.5]} />

      {/* ── STATIC PHYSICS COLLIDERS ── */}
      {/* Floor */}
      <RigidBody type="fixed">
        <CuboidCollider args={[5, 0.1, 5]} position={[0, -0.1, 0]} />
      </RigidBody>
      {/* Walls */}
      <RigidBody type="fixed">
        <CuboidCollider args={[0.1, 3, 5]} position={[-5, 1.5, 0]} />
        <CuboidCollider args={[0.1, 3, 5]} position={[5, 1.5, 0]} />
        <CuboidCollider args={[5, 3, 0.1]} position={[0, 1.5, -5]} />
        <CuboidCollider args={[5, 3, 0.1]} position={[0, 1.5, 5]} />
      </RigidBody>
    </group>
  )
}
