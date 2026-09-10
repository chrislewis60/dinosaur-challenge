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

function drawCenterMonitor(canvas, sitting, missionReady, missionOptions = [{ label: 'WAREHOUSE' }, { label: 'POLICE HQ' }], selectedMissionIndex = 0) {
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
    ctx.font = 'bold 28px "Exo 2", sans-serif'
    ctx.fillText('MISSION SELECT', W / 2, 120)
    ctx.font = '16px "Share Tech Mono", monospace'
    ctx.fillStyle = 'rgba(120, 200, 255, 0.7)'
    ctx.fillText('LEFT / RIGHT ONLY', W / 2, 156)

    const activeMission = missionOptions[selectedMissionIndex] || missionOptions[0]

    ctx.fillStyle = '#a8daff'
    ctx.font = 'bold 36px "Exo 2", sans-serif'
    ctx.shadowBlur = 24; ctx.shadowColor = 'rgba(120, 200, 255, 0.9)'
    ctx.fillText(activeMission.label, W / 2, 245)
    ctx.shadowBlur = 0

    ctx.strokeStyle = 'rgba(120, 200, 255, 0.55)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(W / 2 - 320, 290, 640, 74)
    ctx.fillStyle = 'rgba(120, 200, 255, 0.05)'
    ctx.fillRect(W / 2 - 320, 290, 640, 74)

    ctx.fillStyle = '#a8daff'
    ctx.font = 'bold 18px "Exo 2", sans-serif'
    ctx.fillText('<<  SELECT  >>', W / 2, 336)

    ctx.font = '18px "Share Tech Mono", monospace'
    ctx.fillStyle = 'rgba(120, 200, 255, 0.65)'
    ctx.fillText('CLICK TO START MISSION', W / 2, 395)
    ctx.font = '13px "Share Tech Mono", monospace'
    ctx.fillStyle = 'rgba(120, 200, 255, 0.3)'
    ctx.fillText('USE LEFT / RIGHT ARROWS TO PICK', W / 2, 440)
    ctx.textAlign = 'left'
  }
}

function GamingDesk({ position, rotation = [0, 0, 0], sitting = false, missionReady = false, missionOptions = [{ label: 'WAREHOUSE' }, { label: 'POLICE HQ' }], selectedMissionIndex = 0 }) {
  const centerCanvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 860; c.height = 510
    return c
  }, [])
  const centerTex = useMemo(() => new THREE.CanvasTexture(centerCanvas), [centerCanvas])

  useEffect(() => {
    drawCenterMonitor(centerCanvas, sitting, missionReady, missionOptions, selectedMissionIndex)
    centerTex.needsUpdate = true
  }, [sitting, missionReady, centerCanvas, centerTex, missionOptions, selectedMissionIndex])

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

// ── Bean bag (dynamic physics body with jiggle) ───────────────────────────────

function BeanBag() {
  const bodyRef   = useRef()
  const mainRef   = useRef()
  const wobbleE   = useRef(0)

  useFrame(({ clock }) => {
    if (!bodyRef.current || !mainRef.current) return
    const v = bodyRef.current.linvel()
    const speed = Math.sqrt(v.x * v.x + v.z * v.z)
    // Energy builds up while moving, decays when still
    wobbleE.current = wobbleE.current * 0.90 + speed * 0.10
    const w = Math.sin(clock.elapsedTime * 6) * wobbleE.current * 0.055
    mainRef.current.scale.set(1 + w, 0.58 - w * 0.4, 1 + w)
  })

  return (
    <RigidBody
      ref={bodyRef}
      type="dynamic"
      position={[-3.2, 0.28, 3.2]}
      lockRotations
      linearDamping={25}
      angularDamping={25}
      restitution={0}
      gravityScale={2}
    >
      {/* Small flat collider — just the base of the bag */}
      <CuboidCollider args={[0.8, 0.28, 0.8]} />
      {/* Main body — visual offset so bottom sits at floor level */}
      <mesh ref={mainRef} position={[0, 0.36, 0]} castShadow receiveShadow scale={[1, 0.58, 1]}>
        <sphereGeometry args={[1.1, 28, 20]} />
        <meshStandardMaterial color="#2a0a3a" roughness={0.98} />
      </mesh>
      {/* Upper puffy lobe */}
      <mesh position={[0, 0.24, 0.07]} scale={[0.78, 0.38, 0.78]} castShadow>
        <sphereGeometry args={[1.1, 24, 16]} />
        <meshStandardMaterial color="#220833" roughness={0.98} />
      </mesh>
      {/* Neon seam */}
      <mesh scale={[1.01, 0.58, 1.01]}>
        <torusGeometry args={[1.1, 0.035, 8, 52]} />
        <meshStandardMaterial color="#cc00ff" emissive="#cc00ff" emissiveIntensity={0.7} />
      </mesh>
      <pointLight color="#cc00ff" intensity={0.6} distance={0.8} />
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

// ── Pizza box ────────────────────────────────────────────────────────────────

function makePizzaTexture() {
  const s = 256, cv = document.createElement('canvas')
  cv.width = s; cv.height = s
  const ctx = cv.getContext('2d')
  const cx = s/2, cy = s/2, r = s/2 - 6

  // Crust ring
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2)
  ctx.fillStyle = '#c8763d'; ctx.fill()
  // Sauce
  ctx.beginPath(); ctx.arc(cx, cy, r*0.87, 0, Math.PI*2)
  ctx.fillStyle = '#cc2800'; ctx.fill()
  // Cheese
  ctx.beginPath(); ctx.arc(cx, cy, r*0.81, 0, Math.PI*2)
  ctx.fillStyle = '#f5c540'; ctx.fill()

  // 8 slices — leave 2 missing (eaten)
  const N = 8, missing = new Set([1, 4])
  for (let i = 0; i < N; i++) {
    if (!missing.has(i)) continue
    const a0 = (i/N)*Math.PI*2 - Math.PI/2
    const a1 = ((i+1)/N)*Math.PI*2 - Math.PI/2
    ctx.beginPath(); ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, a0, a1); ctx.closePath()
    ctx.fillStyle = '#c8763d'; ctx.fill()
  }

  // Slice cut lines
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 2
  for (let i = 0; i < N; i++) {
    const a = (i/N)*Math.PI*2 - Math.PI/2
    ctx.beginPath(); ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r); ctx.stroke()
  }

  // Pepperoni
  [[0.42,0.06],[0.18,0.38],[-0.36,0.22],[-0.42,-0.14],[0.12,-0.40],[0.38,-0.28]].forEach(([px,py]) => {
    ctx.beginPath(); ctx.arc(cx+px*r*0.78, cy+py*r*0.78, r*0.09, 0, Math.PI*2)
    ctx.fillStyle = '#8B1A1A'; ctx.fill()
    ctx.strokeStyle = '#5a0a0a'; ctx.lineWidth = 0.8; ctx.stroke()
  })

  return new THREE.CanvasTexture(cv)
}

function PizzaBox({ position, rotation = [0, 0, 0] }) {
  const pizzaTex = useMemo(() => makePizzaTexture(), [])
  const BOX = 0.52, H = 0.03, WALL = 0.04
  return (
    <group position={position} rotation={rotation}>
      {/* Box bottom */}
      <mesh position={[0, H/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[BOX, H, BOX]} />
        <meshStandardMaterial color="#c8a06e" roughness={0.92} />
      </mesh>
      {/* Box side walls */}
      {[[ BOX/2, WALL/2, 0,  WALL, WALL*2, BOX],
        [-BOX/2, WALL/2, 0,  WALL, WALL*2, BOX],
        [0, WALL/2,  BOX/2, BOX,   WALL*2, WALL],
        [0, WALL/2, -BOX/2, BOX,   WALL*2, WALL]].map(([x,y,z,w,h,d],i)=>(
        <mesh key={i} position={[x,y,z]} castShadow>
          <boxGeometry args={[w,h,d]} />
          <meshStandardMaterial color="#c8a06e" roughness={0.92} />
        </mesh>
      ))}
      {/* Pizza disc */}
      <mesh position={[0, H+0.003, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[BOX/2 - 0.04, 28]} />
        <meshStandardMaterial map={pizzaTex} roughness={0.82} metalness={0} />
      </mesh>
      {/* Open lid — pivots from back edge */}
      <group position={[0, H, BOX/2]} rotation={[-Math.PI * 0.72, 0, 0]}>
        <mesh position={[0, 0, -BOX/2]} castShadow>
          <boxGeometry args={[BOX, H, BOX]} />
          <meshStandardMaterial color="#d4b07a" roughness={0.92} />
        </mesh>
        {/* Inside of lid */}
        <mesh position={[0, H*0.5, -BOX/2]}>
          <boxGeometry args={[BOX-0.01, 0.002, BOX-0.01]} />
          <meshStandardMaterial color="#b8904a" roughness={0.97} />
        </mesh>
      </group>
    </group>
  )
}

// ── Pac-Man arcade cabinet ────────────────────────────────────────────────────

function makePacManScreen() {
  const s = 256, c = document.createElement('canvas')
  c.width = s; c.height = s
  const ctx = c.getContext('2d')

  // Background
  ctx.fillStyle = '#000011'; ctx.fillRect(0, 0, s, s)

  // Maze border
  ctx.strokeStyle = '#1a1aff'; ctx.lineWidth = 4
  ctx.strokeRect(12, 44, s - 24, s - 60)

  // Title
  ctx.fillStyle = '#ffff00'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center'
  ctx.fillText('PAC-MAN', s / 2, 32)

  // Dots
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 7; i++) {
    ctx.beginPath(); ctx.arc(40 + i * 28, 110, 4, 0, Math.PI * 2); ctx.fill()
  }

  // Pac-Man (mid-chomp)
  ctx.beginPath()
  ctx.moveTo(78, 158)
  ctx.arc(78, 158, 26, 0.45, Math.PI * 2 - 0.45)
  ctx.closePath()
  ctx.fillStyle = '#ffff00'; ctx.fill()

  // Ghost (Blinky)
  const gx = 185, gy = 155
  ctx.fillStyle = '#ff0000'
  ctx.beginPath()
  ctx.arc(gx, gy - 10, 18, Math.PI, 0)
  ctx.lineTo(gx + 18, gy + 12)
  ctx.lineTo(gx + 12, gy + 7); ctx.lineTo(gx + 6, gy + 12)
  ctx.lineTo(gx,      gy + 7); ctx.lineTo(gx - 6, gy + 12)
  ctx.lineTo(gx - 12, gy + 7); ctx.lineTo(gx - 18, gy + 12)
  ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.arc(gx - 6, gy - 12, 5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(gx + 6, gy - 12, 5, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#00f'
  ctx.beginPath(); ctx.arc(gx - 5, gy - 12, 2.5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(gx + 7, gy - 12, 2.5, 0, Math.PI * 2); ctx.fill()

  // Score line
  ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = '14px monospace'
  ctx.fillText('1UP   HIGH SCORE', 18, s - 28)
  ctx.fillStyle = '#ffff00'
  ctx.fillText('00         24680', 18, s - 10)

  return new THREE.CanvasTexture(c)
}

function PacManCabinet({ position, rotation = [0, 0, 0] }) {
  const screenTex = useMemo(() => makePacManScreen(), [])
  return (
    <group position={position} rotation={rotation}>
      {/* Cabinet body */}
      <mesh castShadow>
        <boxGeometry args={[0.64, 1.82, 0.70]} />
        <meshStandardMaterial color="#111" roughness={0.7} metalness={0.25} />
      </mesh>
      {/* Top marquee — glowing yellow */}
      <mesh position={[0, 0.98, 0.18]}>
        <boxGeometry args={[0.60, 0.26, 0.08]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.9} />
      </mesh>
      {/* Pac-Man text on marquee */}
      <pointLight position={[0, 0.98, 0.35]} color="#ffee00" intensity={1.2} distance={1.4} />
      {/* Screen bezel */}
      <mesh position={[0, 0.32, 0.355]}>
        <boxGeometry args={[0.50, 0.42, 0.025]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.8} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.32, 0.37]}>
        <boxGeometry args={[0.44, 0.36, 0.01]} />
        <meshStandardMaterial map={screenTex} emissive="#ffff00" emissiveIntensity={0.18} roughness={0.85} metalness={0} />
      </mesh>
      <pointLight position={[0, 0.32, 0.55]} color="#ffee00" intensity={0.9} distance={1.2} />
      {/* Control panel (angled) */}
      <mesh position={[0, -0.12, 0.32]} rotation={[-0.45, 0, 0]} castShadow>
        <boxGeometry args={[0.60, 0.055, 0.34]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
      {/* Joystick */}
      <mesh position={[-0.13, -0.04, 0.40]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.11, 8]} />
        <meshStandardMaterial color="#cc2200" roughness={0.5} />
      </mesh>
      <mesh position={[-0.13, 0.02, 0.40]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#cc2200" roughness={0.5} />
      </mesh>
      {/* Buttons */}
      {[0.08, 0.17, 0.26].map((bx, i) => (
        <mesh key={i} position={[bx, -0.04, 0.42]}>
          <cylinderGeometry args={[0.023, 0.023, 0.03, 10]} />
          <meshStandardMaterial
            color={['#ffff00', '#ff2200', '#2200ff'][i]}
            emissive={['#ffff00', '#ff2200', '#2200ff'][i]}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
      {/* Base */}
      <mesh position={[0, -0.96, 0]} castShadow>
        <boxGeometry args={[0.66, 0.10, 0.70]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
    </group>
  )
}

// ── Main Room ─────────────────────────────────────────────────────────────────

export default function ArcadeRoom({ chairBodyRef, sitting = false, missionReady = false, missionOptions = [{ label: 'WAREHOUSE' }, { label: 'POLICE HQ' }], selectedMissionIndex = 0 }) {
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

      {/* ── FRONT WALL ── */}
      <mesh position={[0, 1.5, 5]} rotation={[0, Math.PI, 0]} receiveShadow>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshStandardMaterial map={dirtyWall} roughness={0.95} metalness={0.02} />
      </mesh>

      {/* ── GAMING DESK & CHAIR ── */}
      <GamingDesk
        position={[0, 0, -3.8]}
        sitting={sitting}
        missionReady={missionReady}
        missionOptions={missionOptions}
        selectedMissionIndex={selectedMissionIndex}
      />
      <GamingChair position={[0, 0, -2.6]} rotation={[0, Math.PI, 0]} bodyRef={chairBodyRef} />

      {/* ── SERVER RACK — left corner ── */}
      <ServerRack position={[-4.3, 0.9, -3.5]} />

      {/* ── PIZZA BOXES — floor near gaming desk ── */}
      <PizzaBox position={[ 1.8, 0.03, -1.6]} rotation={[0,  0.4, 0]} />
      <PizzaBox position={[-1.4, 0.03, -0.8]} rotation={[0, -0.6, 0]} />

      {/* ── PAC-MAN ARCADE CABINETS — right wall ── */}
      <PacManCabinet position={[4.35, 0.91, -1.5]}  rotation={[0, -Math.PI / 2, 0]} />
      <PacManCabinet position={[4.35, 0.91, -3.0]}  rotation={[0, -Math.PI / 2, 0]} />

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
