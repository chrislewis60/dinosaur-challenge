import { useMemo, useRef, useState } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// ── Procedural textures ───────────────────────────────────────────────────────

function makeConcreteFloor() {
  const s = 512, c = document.createElement('canvas')
  c.width = s; c.height = s
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#54524f'; ctx.fillRect(0, 0, s, s)
  for (let i = 0; i < 20; i++) {
    ctx.beginPath()
    let x = Math.random() * s, y = Math.random() * s; ctx.moveTo(x, y)
    for (let j = 0; j < 6; j++) { x += (Math.random()-0.5)*90; y += (Math.random()-0.5)*90; ctx.lineTo(x, y) }
    ctx.strokeStyle = `rgba(15,12,10,${0.18+Math.random()*0.25})`; ctx.lineWidth = Math.random()*1.5+0.3; ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.32)'; ctx.lineWidth = 2
  for (let i = 0; i < s; i += 128) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke()
  }
  for (let i = 0; i < 24; i++) {
    const x = Math.random()*s, y = Math.random()*s
    ctx.beginPath(); ctx.ellipse(x, y, Math.random()*45+8, Math.random()*35+6, Math.random()*Math.PI, 0, Math.PI*2)
    ctx.fillStyle = `rgba(35,30,25,${0.07+Math.random()*0.10})`; ctx.fill()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(14, 10); return tex
}

function makeMetalWall() {
  const s = 512, c = document.createElement('canvas')
  c.width = s; c.height = s
  const ctx = c.getContext('2d')
  for (let i = 0; i < s; i += 22) {
    ctx.fillStyle = i % 44 < 22 ? '#3c3a38' : '#2e2c2a'
    ctx.fillRect(0, i, s, 22)
  }
  for (let i = 0; i < 14; i++) {
    const x = Math.random()*s, y = Math.random()*s, r = Math.random()*50+15
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(140,70,20,${0.08+Math.random()*0.10})`); g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s)
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = 1
  for (let i = 0; i < s; i += 22) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke() }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(5, 2); return tex
}

// ── Steady industrial light ───────────────────────────────────────────────────

function IndustrialLight({ position }) {
  return (
    <group position={position}>
      <mesh><cylinderGeometry args={[0.18, 0.22, 0.35, 10]} /><meshStandardMaterial color="#1a1a1a" metalness={0.7} /></mesh>
      <mesh position={[0, -0.3, 0]}><cylinderGeometry args={[0.02, 0.02, 0.6, 6]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[0, -0.7, 0]}><coneGeometry args={[0.28, 0.3, 12, 1, true]} /><meshStandardMaterial color="#2a2a2a" metalness={0.5} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -0.65, 0]}><sphereGeometry args={[0.07, 10, 10]} /><meshStandardMaterial color="#ffe8b0" emissive="#ffe8b0" emissiveIntensity={2.5} /></mesh>
      <pointLight position={[0, -0.7, 0]} color="#ffe8b0" intensity={90} distance={22} decay={2} />
    </group>
  )
}

// ── Long shelf row running along Z ────────────────────────────────────────────
// Each row has proper pallet-rack geometry:
//   - pairs of front+back upright columns every ~2.2 units along Z
//   - five visible shelf boards spanning the full length
//   - front and back edge lips on every shelf level

function ShelfRow({ x, z, length }) {
  const DEPTH  = 1.0           // shelf depth in X
  const LEVELS = [0.42, 1.38, 2.34, 3.30, 4.18]
  const uprightSpacing = 2.2
  const count  = Math.round(length / uprightSpacing) + 1
  const uprightZ = Array.from({ length: count }, (_, i) =>
    -length / 2 + i * (length / Math.max(count - 1, 1))
  )

  return (
    <group position={[x, 0, z]}>
      {/* Front + back upright columns at each division */}
      {uprightZ.map((zp, i) => (
        <group key={i} position={[0, 2.35, zp]}>
          <mesh position={[-DEPTH/2 + 0.04, 0, 0]} castShadow>
            <boxGeometry args={[0.07, 4.7, 0.07]} />
            <meshStandardMaterial color="#252525" metalness={0.82} roughness={0.28} />
          </mesh>
          <mesh position={[DEPTH/2 - 0.04, 0, 0]} castShadow>
            <boxGeometry args={[0.07, 4.7, 0.07]} />
            <meshStandardMaterial color="#252525" metalness={0.82} roughness={0.28} />
          </mesh>
          {/* Base foot */}
          <mesh position={[0, -2.35, 0]}>
            <boxGeometry args={[DEPTH - 0.06, 0.06, 0.12]} />
            <meshStandardMaterial color="#1e1e1e" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Shelf boards — one per level */}
      {LEVELS.map(y => (
        <group key={y}>
          {/* Main board */}
          <mesh position={[0, y, 0]} receiveShadow castShadow>
            <boxGeometry args={[DEPTH, 0.07, length]} />
            <meshStandardMaterial color="#4a4a4a" metalness={0.4} roughness={0.65} />
          </mesh>
          {/* Front lip */}
          <mesh position={[-DEPTH/2 + 0.025, y + 0.07, 0]}>
            <boxGeometry args={[0.05, 0.11, length]} />
            <meshStandardMaterial color="#333" metalness={0.68} roughness={0.38} />
          </mesh>
          {/* Back lip */}
          <mesh position={[DEPTH/2 - 0.025, y + 0.07, 0]}>
            <boxGeometry args={[0.05, 0.11, length]} />
            <meshStandardMaterial color="#333" metalness={0.68} roughness={0.38} />
          </mesh>
          {/* Cross beams at each upright */}
          {uprightZ.map((zp, i) => (
            <mesh key={i} position={[0, y + 0.01, zp]}>
              <boxGeometry args={[DEPTH - 0.1, 0.07, 0.06]} />
              <meshStandardMaterial color="#383838" metalness={0.72} roughness={0.38} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// ── Deterministic rand (no rerenders) ───────────────────────────────────────
const sr = (seed) => {
  const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return v - Math.floor(v)
}

// ── Parcel label textures (generated once, cached) ───────────────────────────

const _labelCache = {}

function getLabel(variant) {
  if (_labelCache[variant]) return _labelCache[variant]

  const W = 256, H = 128
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')

  // Base — cream paper
  ctx.fillStyle = '#f2edd6'; ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#555'; ctx.lineWidth = 2.5; ctx.strokeRect(3, 3, W-6, H-6)

  if (variant === 0) {
    // OMNI-ARC STORAGE
    ctx.fillStyle = '#cc0000'; ctx.fillRect(3, 3, W-6, 28)
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace'
    ctx.fillText('OMNI-ARC STORAGE', 10, 22)
    ctx.fillStyle = '#000'; ctx.font = '11px monospace'
    ctx.fillText('REF: OA-77429-B  WT: 14.3 kg', 10, 48)
    ctx.fillText('DEST: SECTOR-7 VAULT', 10, 64)
    for (let i = 0; i < 44; i++) {
      const bw = sr(i * 3.7) > 0.55 ? 3 : 1
      ctx.fillRect(10 + i * 5, 76, bw, 38)
    }
    ctx.font = '9px monospace'; ctx.fillText('*OA77429B*', 80, H - 6)
  } else if (variant === 1) {
    // HIGH SCORE DATA — thematic!
    ctx.fillStyle = '#003366'; ctx.fillRect(3, 3, W-6, 28)
    ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 14px monospace'
    ctx.fillText('HIGH SCORE DATA', 12, 22)
    ctx.fillStyle = '#000'; ctx.font = '10px monospace'
    ctx.fillText('CLASSIFIED — DO NOT OPEN', 10, 48)
    ctx.font = 'bold 22px monospace'; ctx.fillStyle = '#cc0000'
    ctx.fillText('⚠ OMNI-ARC PROPERTY ⚠', 6, 76)
    for (let i = 0; i < 44; i++) {
      const bw = sr(i * 5.1 + 1) > 0.6 ? 3 : 1
      ctx.fillStyle = '#000'; ctx.fillRect(10 + i * 5, 88, bw, 28)
    }
  } else if (variant === 2) {
    // FRAGILE
    ctx.fillStyle = '#fff'; ctx.fillRect(3, 3, W-6, H-6)
    ctx.strokeStyle = '#cc0000'; ctx.lineWidth = 4; ctx.strokeRect(3, 3, W-6, H-6)
    ctx.fillStyle = '#cc0000'; ctx.font = 'bold 30px monospace'
    ctx.fillText('⚠  FRAGILE', 18, 52)
    ctx.font = '13px monospace'; ctx.fillStyle = '#000'
    ctx.fillText('HANDLE WITH CARE', 28, 76)
    ctx.fillText('THIS SIDE UP  ↑', 38, 100)
  } else if (variant === 3) {
    // ARCADE LEGENDS ARCHIVE
    ctx.fillStyle = '#1a0030'; ctx.fillRect(3, 3, W-6, 30)
    ctx.fillStyle = '#ff00ff'; ctx.font = 'bold 13px monospace'
    ctx.fillText('ARCADE LEGENDS ARCHIVE', 6, 23)
    ctx.fillStyle = '#000'; ctx.font = '11px monospace'
    ctx.fillText(`RECORD ID: ${Math.floor(sr(variant*77)*999999).toString().padStart(6,'0')}`, 10, 52)
    ctx.fillText('STATUS: PURGED', 10, 68)
    ctx.fillStyle = '#cc0000'; ctx.font = 'bold 11px monospace'
    ctx.fillText('PROPERTY OF OMNI-ARC CORP', 6, 88)
    for (let i = 0; i < 44; i++) {
      const bw = sr(i * 2.9 + 3) > 0.58 ? 3 : 1
      ctx.fillStyle = '#000'; ctx.fillRect(10 + i * 5, 96, bw, 24)
    }
  } else {
    // Plain code label
    ctx.fillStyle = '#000'; ctx.font = 'bold 12px monospace'
    ctx.fillText('OA SECURE LOGISTICS', 10, 24)
    ctx.font = '11px monospace'
    ctx.fillText(`PKG: ${Math.floor(sr(variant*53)*99999).toString().padStart(5,'0')}-XR`, 10, 44)
    ctx.fillText('FLOOR: B2  UNIT: 7', 10, 60)
    for (let i = 0; i < 44; i++) {
      const bw = sr(i * 4.3 + 7) > 0.57 ? 3 : 1
      ctx.fillRect(10 + i * 5, 70, bw, 42)
    }
    ctx.font = '9px monospace'; ctx.fillText(`*${Math.floor(sr(variant)*99999)}*`, 88, H - 5)
  }

  _labelCache[variant] = new THREE.CanvasTexture(c)
  return _labelCache[variant]
}

// ── Crate (static visual — used on shelves) ───────────────────────────────────

function Crate({ position, rotation = [0, 0, 0], w=1.1, h=1.1, d=1.1, color='#7a5c18', open=false, labelV=0 }) {
  const label = getLabel(labelV % 5)
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Parcel label on front face */}
      <mesh position={[0, h * 0.08, d / 2 + 0.002]}>
        <planeGeometry args={[w * 0.78, h * 0.5]} />
        <meshStandardMaterial map={label} roughness={0.75} transparent alphaTest={0.05} />
      </mesh>
      {open && (
        <mesh position={[0, h / 2 + 0.02, -d * 0.22]} rotation={[0.38, 0, 0]} castShadow>
          <boxGeometry args={[w, 0.045, d * 0.52]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      )}
    </group>
  )
}

// ── PhysicsCrate (independent dynamic body — used on floor) ──────────────────

function PhysicsCrate({ position, w=1.1, h=1.1, d=1.1, color='#7a5c18', labelV=0 }) {
  const label = getLabel(labelV % 5)
  return (
    <RigidBody
      type="dynamic"
      position={position}
      linearDamping={12}
      angularDamping={10}
      restitution={0.05}
    >
      <CuboidCollider args={[w/2, h/2, d/2]} />
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Parcel label on front face */}
      <mesh position={[0, h * 0.08, d / 2 + 0.002]}>
        <planeGeometry args={[w * 0.78, h * 0.5]} />
        <meshStandardMaterial map={label} roughness={0.75} transparent alphaTest={0.05} />
      </mesh>
    </RigidBody>
  )
}

// ── Barrel ────────────────────────────────────────────────────────────────────

function Barrel({ position }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.28, 0.28, 0.85, 12]} />
      <meshStandardMaterial color="#334433" metalness={0.45} roughness={0.7} />
    </mesh>
  )
}

// ── Guard Dialog System ──────────────────────────────────────────────────────────

const GUARD_DIALOG = [
  "Nothing here...",
  "Can't wait for tea this evening",
  "The only good thing about this job is the pay",
  "These night shifts are killing me",
  "Did you hear about the break-in last week?",
  "Same old patrol, every night",
  "I should've become a programmer",
  "At least it's quiet tonight",
  "Three more hours to go...",
  "Coffee sounds good right now",
  "Why do we even guard this stuff?",
  "My feet are killing me"
]

// Comic book style dialog bubble that floats above guard's head
function DialogBubble({ text, position }) {
  const width = Math.min(text.length * 0.10 + 0.6, 3.5)
  const height = 0.45
  
  return (
    <group position={position}>
      {/* Main white bubble background */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Black border (slightly larger) */}
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[width + 0.08, height + 0.08]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Drop shadow */}
      <mesh position={[0.08, -0.08, -0.04]}>
        <planeGeometry args={[width + 0.08, height + 0.08]} />
        <meshBasicMaterial color="#000000" opacity={0.8} transparent />
      </mesh>
      
      {/* Tail pointer - black outline */}
      <mesh position={[0, -height/2 - 0.15, -0.03]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.15, 0.3, 3]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Tail pointer - white fill */}
      <mesh position={[0, -height/2 - 0.13, -0.02]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.12, 0.22, 3]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* Text - Comic book font style */}
      <Text
        position={[0, 0, 0]}
        fontSize={0.14}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        maxWidth={width - 0.3}
        fontWeight="bold"
        letterSpacing={0.01}
      >
        {text}
      </Text>
    </group>
  )
}

// ── OmniArc Guard ─────────────────────────────────────────────────────────────────

const GUARD_ROUTES = [
  // Left outer aisle — back and forth
  [{ x: -27, z:  8 }, { x: -27, z: -19 }],
  // Between rows 1 & 2
  [{ x: -16.5, z: -18 }, { x: -16.5, z:  8  }],
  // Between rows 2 & 3
  [{ x:  -5.5, z:  8  }, { x:  -5.5, z: -18 }],
  // Between rows 3 & 4
  [{ x:   5.5, z: -18 }, { x:   5.5, z:  8  }],
  // Between rows 4 & 5
  [{ x:  16.5, z:  8  }, { x:  16.5, z: -18 }],
  // Front cross-patrol (free area)
  [{ x: -22, z: 13 }, { x: 22, z: 13 }, { x: 22, z: 17 }, { x: -22, z: 17 }],
]

function Guard({ waypoints, speed = 1.9, walkFreq = 3.6, phaseOffset = 0, playerPosRef, onCaught, dialogPhrase }) {
  const groupRef    = useRef()
  const hipsRef     = useRef()
  const torsoRef    = useRef()
  const headRef     = useRef()
  const tailRef     = useRef()
  const tailSeg2    = useRef()
  const tailSeg3    = useRef()
  const tailSeg4    = useRef()
  const tailSeg5    = useRef()
  const leftArmRef  = useRef()
  const rightArmRef = useRef()
  const leftLegRef  = useRef()
  const rightLegRef = useRef()
  const leftKneeRef  = useRef()
  const rightKneeRef = useRef()
  const visorRef     = useRef()   // for detection flash
  const detectedRef  = useRef(false)
  const wpIdx       = useRef(0)
  const waitTimer   = useRef(0)
  const isWaiting   = useRef(false)
  
  // Dialog state
  const [currentDialog, setCurrentDialog] = useState(dialogPhrase || GUARD_DIALOG[0])
  const dialogTimer = useRef(0)
  const [showDialog, setShowDialog] = useState(true)

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime

    // Dialog timer - cycle through phrases every 8-15 seconds
    dialogTimer.current += delta
    if (dialogTimer.current > 8 + (phaseOffset * 2)) {
      const newPhrase = GUARD_DIALOG[Math.floor(Math.random() * GUARD_DIALOG.length)]
      setCurrentDialog(newPhrase)
      setShowDialog(true)
      dialogTimer.current = 0
    }

    if (isWaiting.current) {
      waitTimer.current -= delta
      // Look around while waiting
      if (headRef.current)  headRef.current.rotation.y = Math.sin(t * 1.1) * 0.72
      if (torsoRef.current) torsoRef.current.scale.y   = 1 + Math.sin(t * 1.7) * 0.013
      if (waitTimer.current <= 0) {
        isWaiting.current = false
        wpIdx.current = (wpIdx.current + 1) % waypoints.length
      }
      return
    }

    const target = waypoints[wpIdx.current]
    const pos    = groupRef.current.position
    const dx     = target.x - pos.x
    const dz     = target.z - pos.z
    const distSq = dx * dx + dz * dz

    if (distSq < 0.08) {
      isWaiting.current = true
      waitTimer.current = 1.2 + (wpIdx.current % 3) * 0.9
      return
    }

    const dist = Math.sqrt(distSq)
    pos.x += (dx / dist) * speed * delta
    pos.z += (dz / dist) * speed * delta

    // Smooth body rotation toward movement direction
    const targetY = Math.atan2(dx, dz)
    let diff = targetY - groupRef.current.rotation.y
    if (diff >  Math.PI) diff -= Math.PI * 2
    if (diff < -Math.PI) diff += Math.PI * 2
    groupRef.current.rotation.y += diff * Math.min(1, delta * 8)

    // Guard detection — check player position every frame with line-of-sight
    if (playerPosRef && groupRef.current && !detectedRef.current) {
      const px = playerPosRef.current.x
      const pz = playerPosRef.current.z
      const gx = groupRef.current.position.x
      const gz = groupRef.current.position.z
      const dx = px - gx,  dz = pz - gz
      const distSq = dx*dx + dz*dz

      let spotted = false
      
      // Check if player is in vision range and cone
      // Very close — always detected (< 1.2 units)
      if (distSq < 1.44) {
        spotted = true
      }
      // In front vision cone (90° total, 6 unit range)
      else if (distSq < 36) {
        const facing = groupRef.current.rotation.y
        let diff = Math.atan2(dx, dz) - facing
        if (diff >  Math.PI) diff -= Math.PI * 2
        if (diff < -Math.PI) diff += Math.PI * 2
        if (Math.abs(diff) < 0.78) {   // ~45° half-angle
          // Check line-of-sight — blocked by shelf rows, walls, or server room
          const hasLineOfSight = (() => {
            // Shelf row positions (x-coords of the 5 shelf columns)
            const shelfX = [-22, -11, 0, 11, 22]
            const shelfHalfWidth = 0.55  // Half-width of each shelf column
            const shelfZ = { min: -21, max: 9 }  // Shelf depth range
            
            // Check if line crosses any shelf column
            for (const sx of shelfX) {
              // Simple AABB line intersection check
              const minX = Math.min(gx, px)
              const maxX = Math.max(gx, px)
              const minZ = Math.min(gz, pz)
              const maxZ = Math.max(gz, pz)
              
              // If guard and player are on opposite sides of a shelf column
              if (minX < sx - shelfHalfWidth && maxX > sx + shelfHalfWidth) {
                // Check if the line passes through the shelf's Z range
                if (!(maxZ < shelfZ.min || minZ > shelfZ.max)) {
                  // Line crosses this shelf column - blocked!
                  return false
                }
              }
            }
            
            // Check server room walls (back wall area)
            if ((gz < -22 && pz > -22) || (gz > -22 && pz < -22)) {
              // Guard and player on opposite sides of server room wall
              if (Math.abs(px) < 7 && Math.abs(gx) < 7) return false
            }
            
            return true  // Clear line of sight
          })()
          
          if (hasLineOfSight) spotted = true
        }
      }

      if (spotted) {
        detectedRef.current = true
        if (visorRef.current) { visorRef.current.color.set('#ffffff'); visorRef.current.emissiveIntensity = 5 }
        onCaught?.()
      }
    }

    // Visor subtle idle pulse
    if (!detectedRef.current && visorRef.current)
      visorRef.current.emissiveIntensity = 1.6 + Math.sin(t * 2.2) * 0.15

    // Walk cycle — uses this guard's own frequency and phase offset
    const wt = t * walkFreq + phaseOffset
    const sw = Math.sin(wt)
    if (leftArmRef.current)  leftArmRef.current.rotation.x  =  sw * 0.52
    if (rightArmRef.current) rightArmRef.current.rotation.x = -sw * 0.52
    if (leftLegRef.current)  leftLegRef.current.rotation.x  = -sw * 0.52
    if (rightLegRef.current) rightLegRef.current.rotation.x  =  sw * 0.52

    // Knee bend — shin folds forward during each leg's swing phase
    const KNEE = 0.75
    if (leftKneeRef.current)  leftKneeRef.current.rotation.x  =  Math.max(0, -sw) * KNEE
    if (rightKneeRef.current) rightKneeRef.current.rotation.x =  Math.max(0,  sw) * KNEE

    // Hip side-sway
    if (hipsRef.current)  hipsRef.current.rotation.z   =  Math.sin(wt * 0.5) * 0.055
    // Torso counter-sway + normal breathing scale
    if (torsoRef.current) {
      torsoRef.current.rotation.z = -Math.sin(wt * 0.5) * 0.03
      torsoRef.current.scale.y    = 1
    }
    // Head glances sideways while walking
    if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.55) * 0.28

    // Tail animation — wave motion through segments for flowing movement
    if (tailRef.current) {
      // Base tail swish (y-axis rotation)
      const baseSwish = Math.sin(wt * 0.5 + Math.PI) * 0.45
      tailRef.current.rotation.y = baseSwish
      // Base tilt with bob (x-axis rotation)
      tailRef.current.rotation.x = Math.PI / 2.2 + Math.sin(wt * 0.65) * 0.12
      // Slight twist (z-axis)
      tailRef.current.rotation.z = Math.sin(wt * 0.35) * 0.08
    }
    
    // Each segment follows the previous with a phase delay, creating a wave
    if (tailSeg2.current) {
      tailSeg2.current.rotation.x = 0.25 + Math.sin(wt * 0.6 + 0.5) * 0.15
      tailSeg2.current.rotation.y = Math.sin(wt * 0.5 + 0.3) * 0.12
    }
    if (tailSeg3.current) {
      tailSeg3.current.rotation.x = 0.25 + Math.sin(wt * 0.6 + 1.0) * 0.18
      tailSeg3.current.rotation.y = Math.sin(wt * 0.5 + 0.6) * 0.15
    }
    if (tailSeg4.current) {
      tailSeg4.current.rotation.x = 0.25 + Math.sin(wt * 0.6 + 1.5) * 0.20
      tailSeg4.current.rotation.y = Math.sin(wt * 0.5 + 0.9) * 0.18
    }
    if (tailSeg5.current) {
      tailSeg5.current.rotation.x = 0.22 + Math.sin(wt * 0.6 + 2.0) * 0.22
      tailSeg5.current.rotation.y = Math.sin(wt * 0.5 + 1.2) * 0.20
    }

    pos.y = Math.abs(sw) * 0.018
  })

  const C = { 
    body: '#3d5c2e',      // Dark green dinosaur body
    scales: '#2a4020',    // Darker green for scales
    belly: '#6b8f5a',     // Lighter belly
    red: '#ff3300',       // Bright red eyes
    teeth: '#e8e8e8',     // White teeth
    claws: '#1a1a1a'      // Dark claws
  }

  return (
    <group ref={groupRef} position={[waypoints[0].x, 0, waypoints[0].z]}>
      {/* Dialog bubble above head */}
      {showDialog && !detectedRef.current && (
        <DialogBubble text={currentDialog} position={[0, 2.8, 0]} />
      )}

      {/* ── Hips / legs ── */}
      <group ref={hipsRef}>
        {/* ── Tail — multi-segment, curves backward and up like player ── */}
        <group ref={tailRef} position={[0, 0.82, -0.08]} rotation={[Math.PI / 2.2, 0, 0]}>
          {/* Seg 1 — widest, base */}
          <mesh position={[0, -0.12, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.07, 0.24, 10]} />
            <meshStandardMaterial color={C.body} roughness={0.85} />
          </mesh>
          {/* Spine ridge on seg 1 */}
          <mesh position={[0, -0.12, 0.04]} rotation={[0, 0, 0]}>
            <coneGeometry args={[0.04, 0.10, 5]} />
            <meshStandardMaterial color={C.scales} roughness={0.8} />
          </mesh>
          
          {/* Seg 2 — curves up */}
          <group ref={tailSeg2} position={[0, -0.25, 0]} rotation={[0.25, 0, 0]}>
            <mesh position={[0, -0.12, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.055, 0.24, 10]} />
              <meshStandardMaterial color={C.body} roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.12, 0.035]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.035, 0.09, 5]} />
              <meshStandardMaterial color={C.scales} roughness={0.8} />
            </mesh>
            
            {/* Seg 3 */}
            <group ref={tailSeg3} position={[0, -0.25, 0]} rotation={[0.25, 0, 0]}>
              <mesh position={[0, -0.11, 0]} castShadow>
                <cylinderGeometry args={[0.050, 0.040, 0.22, 10]} />
                <meshStandardMaterial color={C.body} roughness={0.85} />
              </mesh>
              <mesh position={[0, -0.11, 0.03]} rotation={[0, 0, 0]}>
                <coneGeometry args={[0.03, 0.08, 5]} />
                <meshStandardMaterial color={C.scales} roughness={0.8} />
              </mesh>
              
              {/* Seg 4 */}
              <group ref={tailSeg4} position={[0, -0.23, 0]} rotation={[0.25, 0, 0]}>
                <mesh position={[0, -0.10, 0]} castShadow>
                  <cylinderGeometry args={[0.035, 0.025, 0.20, 10]} />
                  <meshStandardMaterial color={C.body} roughness={0.85} />
                </mesh>
                <mesh position={[0, -0.10, 0.02]} rotation={[0, 0, 0]}>
                  <coneGeometry args={[0.025, 0.07, 5]} />
                  <meshStandardMaterial color={C.scales} roughness={0.8} />
                </mesh>
                
                {/* Seg 5 — slim taper */}
                <group ref={tailSeg5} position={[0, -0.21, 0]} rotation={[0.22, 0, 0]}>
                  <mesh position={[0, -0.09, 0]} castShadow>
                    <cylinderGeometry args={[0.020, 0.012, 0.18, 8]} />
                    <meshStandardMaterial color={C.scales} roughness={0.85} />
                  </mesh>
                  {/* Sharp point */}
                  <mesh position={[0, -0.22, 0]} rotation={[Math.PI, 0, 0]} castShadow>
                    <coneGeometry args={[0.012, 0.12, 8]} />
                    <meshStandardMaterial color={C.scales} roughness={0.7} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>

        {/* Hip scales/armor */}
        <mesh position={[0, 0.88, 0]}>
          <boxGeometry args={[0.45, 0.12, 0.30]} />
          <meshStandardMaterial color={C.scales} roughness={0.85} />
        </mesh>

        {/* Left leg - Dinosaur style */}
        <group ref={leftLegRef} position={[-0.115, 0.80, 0]}>
          {/* Thigh - muscular */}
          <mesh position={[0, -0.17, 0]} castShadow>
            <cylinderGeometry args={[0.10, 0.085, 0.40, 8]} />
            <meshStandardMaterial color={C.body} roughness={0.85} />
          </mesh>
          {/* Knee pivot — shin + foot rotate from here */}
          <group ref={leftKneeRef} position={[0, -0.38, 0]}>
            {/* Knee joint scales */}
            <mesh position={[0, 0, 0.058]}>
              <boxGeometry args={[0.14, 0.11, 0.08]} />
              <meshStandardMaterial color={C.scales} roughness={0.8} />
            </mesh>
            {/* Shin - reptilian */}
            <mesh position={[0, -0.19, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.07, 0.34, 8]} />
              <meshStandardMaterial color={C.body} roughness={0.85} />
            </mesh>
            {/* Dinosaur foot with three claws */}
            <mesh position={[0, -0.39, 0.06]} castShadow>
              <boxGeometry args={[0.14, 0.08, 0.18]} />
              <meshStandardMaterial color={C.scales} roughness={0.9} />
            </mesh>
            {/* Three front claws */}
            {[-0.05, 0, 0.05].map((cx, ci) => (
              <mesh key={ci} position={[cx, -0.43, 0.16]} rotation={[0.3, 0, 0]}>
                <coneGeometry args={[0.02, 0.12, 4]} />
                <meshStandardMaterial color={C.claws} roughness={0.7} />
              </mesh>
            ))}
            {/* Back claw */}
            <mesh position={[0, -0.42, -0.08]} rotation={[-0.5, 0, 0]}>
              <coneGeometry args={[0.025, 0.10, 4]} />
              <meshStandardMaterial color={C.claws} roughness={0.7} />
            </mesh>
          </group>
        </group>

        {/* Right leg - Dinosaur style */}
        <group ref={rightLegRef} position={[0.115, 0.80, 0]}>
          {/* Thigh */}
          <mesh position={[0, -0.17, 0]} castShadow>
            <cylinderGeometry args={[0.10, 0.085, 0.40, 8]} />
            <meshStandardMaterial color={C.body} roughness={0.85} />
          </mesh>
          <group ref={rightKneeRef} position={[0, -0.38, 0]}>
            <mesh position={[0, 0, 0.058]}>
              <boxGeometry args={[0.14, 0.11, 0.08]} />
              <meshStandardMaterial color={C.scales} roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.19, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.07, 0.34, 8]} />
              <meshStandardMaterial color={C.body} roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.39, 0.06]} castShadow>
              <boxGeometry args={[0.14, 0.08, 0.18]} />
              <meshStandardMaterial color={C.scales} roughness={0.9} />
            </mesh>
            {[-0.05, 0, 0.05].map((cx, ci) => (
              <mesh key={ci} position={[cx, -0.43, 0.16]} rotation={[0.3, 0, 0]}>
                <coneGeometry args={[0.02, 0.12, 4]} />
                <meshStandardMaterial color={C.claws} roughness={0.7} />
              </mesh>
            ))}
            <mesh position={[0, -0.42, -0.08]} rotation={[-0.5, 0, 0]}>
              <coneGeometry args={[0.025, 0.10, 4]} />
              <meshStandardMaterial color={C.claws} roughness={0.7} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ── Torso / tiny arms / dinosaur head ── */}
      <group ref={torsoRef} position={[0, 0.92, 0]} rotation={[0.2, 0, 0]}>
        {/* Main torso - tilted forward like T-Rex */}
        <mesh position={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[0.42, 0.55, 0.35]} />
          <meshStandardMaterial color={C.body} roughness={0.85} />
        </mesh>
        {/* Belly scales - lighter color */}
        <mesh position={[0, 0.20, 0.18]}>
          <boxGeometry args={[0.35, 0.45, 0.02]} />
          <meshStandardMaterial color={C.belly} roughness={0.9} />
        </mesh>
        {/* Back ridges */}
        {[0.15, 0.28, 0.41].map((ry, ri) => (
          <mesh key={ri} position={[0, ry, -0.15]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.06, 0.12, 4]} />
            <meshStandardMaterial color={C.scales} roughness={0.8} />
          </mesh>
        ))}
        
        {/* Shoulder joints */}
        {[-0.24, 0.24].map((sx, si) => (
          <mesh key={si} position={[sx, 0.45, 0.08]}>
            <sphereGeometry args={[0.09, 8, 6]} />
            <meshStandardMaterial color={C.scales} roughness={0.8} />
          </mesh>
        ))}

        {/* Left arm - TINY T-Rex style */}
        <group ref={leftArmRef} position={[-0.24, 0.38, 0.05]}>
          <mesh position={[0, -0.08, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.035, 0.18, 6]} />
            <meshStandardMaterial color={C.body} roughness={0.85} />
          </mesh>
          {/* Tiny hand with two claws */}
          <mesh position={[0, -0.18, 0]} castShadow>
            <boxGeometry args={[0.06, 0.05, 0.04]} />
            <meshStandardMaterial color={C.scales} roughness={0.9} />
          </mesh>
          <mesh position={[-0.02, -0.20, 0.02]} rotation={[0.4, 0.2, 0]}>
            <coneGeometry args={[0.012, 0.05, 4]} />
            <meshStandardMaterial color={C.claws} roughness={0.7} />
          </mesh>
          <mesh position={[0.02, -0.20, 0.02]} rotation={[0.4, -0.2, 0]}>
            <coneGeometry args={[0.012, 0.05, 4]} />
            <meshStandardMaterial color={C.claws} roughness={0.7} />
          </mesh>
        </group>

        {/* Right arm - TINY T-Rex style */}
        <group ref={rightArmRef} position={[0.24, 0.38, 0.05]}>
          <mesh position={[0, -0.08, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.035, 0.18, 6]} />
            <meshStandardMaterial color={C.body} roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.18, 0]} castShadow>
            <boxGeometry args={[0.06, 0.05, 0.04]} />
            <meshStandardMaterial color={C.scales} roughness={0.9} />
          </mesh>
          <mesh position={[-0.02, -0.20, 0.02]} rotation={[0.4, 0.2, 0]}>
            <coneGeometry args={[0.012, 0.05, 4]} />
            <meshStandardMaterial color={C.claws} roughness={0.7} />
          </mesh>
          <mesh position={[0.02, -0.20, 0.02]} rotation={[0.4, -0.2, 0]}>
            <coneGeometry args={[0.012, 0.05, 4]} />
            <meshStandardMaterial color={C.claws} roughness={0.7} />
          </mesh>
        </group>

        {/* Neck - muscular */}
        <mesh position={[0, 0.56, 0.10]} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.10, 0.12, 0.16, 8]} />
          <meshStandardMaterial color={C.body} roughness={0.8} />
        </mesh>

        {/* Head group — turns independently (dinosaur head) */}
        <group ref={headRef} position={[0, 0.68, 0.18]}>
          {/* Main skull - elongated */}
          <mesh position={[0, 0.06, 0.16]} castShadow>
            <boxGeometry args={[0.22, 0.24, 0.40]} />
            <meshStandardMaterial color={C.body} roughness={0.8} />
          </mesh>
          {/* Snout */}
          <mesh position={[0, 0.02, 0.42]} castShadow>
            <boxGeometry args={[0.18, 0.18, 0.20]} />
            <meshStandardMaterial color={C.body} roughness={0.85} />
          </mesh>
          {/* Nostrils */}
          {[-0.05, 0.05].map((nx, ni) => (
            <mesh key={ni} position={[nx, 0.06, 0.52]}>
              <sphereGeometry args={[0.025, 6, 5]} />
              <meshStandardMaterial color="#000" roughness={0.9} />
            </mesh>
          ))}
          
          {/* Upper jaw teeth */}
          {[-0.07, -0.03, 0.01, 0.05].map((tx, ti) => (
            <mesh key={ti} position={[tx, -0.04, 0.44 + ti * 0.02]} rotation={[0.3, 0, 0]}>
              <coneGeometry args={[0.015, 0.06, 4]} />
              <meshStandardMaterial color={C.teeth} roughness={0.4} />
            </mesh>
          ))}
          
          {/* Lower jaw - slight dark shade */}
          <mesh position={[0, -0.08, 0.34]}>
            <boxGeometry args={[0.16, 0.08, 0.32]} />
            <meshStandardMaterial color={C.scales} roughness={0.85} />
          </mesh>
          {/* Lower jaw teeth */}
          {[-0.06, -0.02, 0.02, 0.06].map((tx, ti) => (
            <mesh key={`lower${ti}`} position={[tx, -0.09, 0.36 + ti * 0.02]} rotation={[-0.3, 0, 0]}>
              <coneGeometry args={[0.012, 0.05, 4]} />
              <meshStandardMaterial color={C.teeth} roughness={0.4} />
            </mesh>
          ))}

          {/* Eyes — RED GLOWING (for detection) — ref for detection flash */}
          {[-0.09, 0.09].map((ex, ei) => (
            <mesh key={ei} position={[ex, 0.10, 0.32]}>
              <sphereGeometry args={[0.04, 8, 6]} />
              <meshStandardMaterial 
                ref={ei === 0 ? visorRef : null}
                color={C.red} 
                emissive={C.red} 
                emissiveIntensity={2.0} 
              />
            </mesh>
          ))}
          
          {/* Head ridge/crest */}
          <mesh position={[0, 0.18, 0.08]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.18, 0.08, 0.25]} />
            <meshStandardMaterial color={C.scales} roughness={0.75} />
          </mesh>
          {/* Small horns above eyes */}
          {[-0.08, 0.08].map((hx, hi) => (
            <mesh key={hi} position={[hx, 0.20, 0.20]} rotation={[-0.5, 0, hx > 0 ? -0.3 : 0.3]}>
              <coneGeometry args={[0.03, 0.10, 4]} />
              <meshStandardMaterial color={C.scales} roughness={0.8} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Flashlight glow from chest */}
      <pointLight position={[0, 1.60, 0.58]} color="#fffde0" intensity={16} distance={13} decay={2} />

      {/* ── Detection zone indicators ── */}
      {/* Red disc — 1-unit instant-detect radius */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, 0.02, 32]} />
        <meshStandardMaterial
          color="#ff1100" emissive="#ff1100" emissiveIntensity={0.9}
          transparent opacity={0.35} depthWrite={false} />
      </mesh>
      {/* Amber cone — forward vision area (6 units long, ~50° total) */}
      {/* tip is at guard centre, base fans 3 units wide at 6-unit range */}
      <mesh position={[0, 0.03, 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[3, 6, 28]} />
        <meshStandardMaterial
          color="#ff8800" emissive="#ff6600" emissiveIntensity={0.4}
          transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ── Server Room ─────────────────────────────────────────────────────────────────

function ServerRoom({ playerPosRef, onServerNear, onNearDoor, lockPicked }) {
  const doorRef  = useRef()
  const doorAngle = useRef(0)

  useFrame((_, delta) => {
    // Animate door open when lock is picked
    if (doorRef.current) {
      const target = lockPicked ? -Math.PI / 2 : 0
      doorAngle.current += (target - doorAngle.current) * Math.min(1, delta * 2.5)
      doorRef.current.rotation.y = doorAngle.current
    }
    // Proximity checks
    if (!playerPosRef) return
    const px = playerPosRef.current.x, pz = playerPosRef.current.z
    // Near door (outside)
    onNearDoor?.(Math.abs(px) < 3 && pz > -26.5 && pz < -22)
    // Near terminal (inside)
    const dx = px - 0, dz = pz + 30
    onServerNear?.(dx*dx + dz*dz < 9)
  })

  return (
    <group>
      {/* Floor */}
      <RigidBody type="fixed">
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, -29]} receiveShadow>
          <planeGeometry args={[14, 10]} />
          <meshStandardMaterial color="#2a2826" roughness={0.95} />
        </mesh>
        <CuboidCollider args={[7, 0.1, 5]} position={[0, -0.1, -29]} />
      </RigidBody>
      {/* Ceiling */}
      <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 9, -29]}>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#0a0a0e" roughness={1} />
      </mesh>
      {/* Walls */}
      {[[-7, 9/2, -29, 0.2, 9, 10], [7, 9/2, -29, 0.2, 9, 10], [0, 9/2, -34, 14.4, 9, 0.2]].map(([x,y,z,w,h,d],i) => (
        <mesh key={i} position={[x,y,z]} receiveShadow>
          <boxGeometry args={[w,h,d]} />
          <meshStandardMaterial color="#1a1a28" roughness={0.85} />
        </mesh>
      ))}
      {/* Lintel above doorway */}
      <mesh position={[0, 6.25, -24]}>
        <boxGeometry args={[5, 3.5, 0.2]} />
        <meshStandardMaterial color="#1a1a28" roughness={0.85} />
      </mesh>
      {/* Door \u2014 hinge on left side, swings into server room */}
      <group ref={doorRef} position={[-2.5, 0, -24.08]}>
        {/* Door panel */}
        <mesh position={[2.5, 1.25, 0]} castShadow>
          <boxGeometry args={[5, 2.5, 0.12]} />
          <meshStandardMaterial color="#0d0d1e" metalness={0.55} roughness={0.55} />
        </mesh>
        {/* Horizontal reinforcement bars */}
        {[0.4, 1.25, 2.05].map((y, i) => (
          <mesh key={i} position={[2.5, y, 0.065]}>
            <boxGeometry args={[4.8, 0.07, 0.03]} />
            <meshStandardMaterial color="#1a1a30" metalness={0.7} roughness={0.35} />
          </mesh>
        ))}
        {/* Electronic keypad */}
        <mesh position={[4.6, 1.1, 0.07]}>
          <boxGeometry args={[0.18, 0.28, 0.04]} />
          <meshStandardMaterial color="#080818" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Keypad indicator — red when locked, green when picked */}
        <mesh position={[4.6, 1.28, 0.10]}>
          <sphereGeometry args={[0.025, 8, 6]} />
          <meshStandardMaterial
            color={lockPicked ? '#00ff41' : '#ff2200'}
            emissive={lockPicked ? '#00ff41' : '#ff2200'}
            emissiveIntensity={1.5}
          />
        </mesh>
        <pointLight
          position={[4.6, 1.28, 0.3]}
          color={lockPicked ? '#00ff41' : '#ff2200'}
          intensity={2} distance={1.2}
        />
        {/* Door handle */}
        <mesh position={[4.2, 1.2, 0.1]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.28, 8]} />
          <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Warning stripes on door */}
        {[0, 1, 2, 3].map(i => (
          <mesh key={i} position={[0.5 + i * 1.1, 1.25, 0.065]} rotation={[0, 0, 0.45]}>
            <boxGeometry args={[0.12, 2.4, 0.01]} />
            <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.3} transparent opacity={0.55} />
          </mesh>
        ))}
      </group>
      {/* Door frame light strip */}
      <pointLight position={[0, 2.6, -23.6]} color="#2233ff" intensity={8} distance={4} />

      {/* Server racks along back wall */}
      {[-5, -2.5, 0, 2.5, 5].map((x, ri) => (
        <group key={ri} position={[x, 0, -33.2]}>
          <mesh castShadow>
            <boxGeometry args={[1.9, 2.4, 0.65]} />
            <meshStandardMaterial color="#060610" roughness={0.5} metalness={0.4} />
          </mesh>
          {[0.9, 0.55, 0.2, -0.15, -0.5, -0.85].map((y, ii) => (
            <mesh key={ii} position={[0.82, y, 0.33]}>
              <sphereGeometry args={[0.025, 6, 5]} />
              <meshStandardMaterial
                color={ii % 2 === 0 ? '#00ff41' : '#ff8800'}
                emissive={ii % 2 === 0 ? '#00ff41' : '#ff8800'}
                emissiveIntensity={1.4}
              />
            </mesh>
          ))}
          <pointLight position={[0, 0, 0.5]} color={ri % 2 === 0 ? '#00ff41' : '#0055ff'} intensity={4} distance={3} />
        </group>
      ))}

      {/* Central hack terminal */}
      <group position={[0, 0, -30]}>
        <mesh castShadow>
          <boxGeometry args={[1.6, 1.1, 0.55]} />
          <meshStandardMaterial color="#04040e" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0.36, 0.285]}>
          <boxGeometry args={[1.3, 0.55, 0.02]} />
          <meshStandardMaterial color="#001a00" emissive="#00ff41" emissiveIntensity={0.55} />
        </mesh>
        {/* Keyboard */}
        <mesh position={[0, -0.08, 0.25]}>
          <boxGeometry args={[1.1, 0.04, 0.28]} />
          <meshStandardMaterial color="#080808" roughness={0.6} />
        </mesh>
        <pointLight position={[0, 0.6, 0.6]} color="#00ff41" intensity={14} distance={6} />
      </group>

      {/* Room lighting */}
      <pointLight position={[0,  8.5, -29]} color="#2050ff" intensity={55} distance={14} />
      <pointLight position={[-5, 1.5, -33]} color="#00ffcc" intensity={12} distance={5} />
      <pointLight position={[ 5, 1.5, -33]} color="#00ffcc" intensity={12} distance={5} />
    </group>
  )
}

// ── Warehouse ─────────────────────────────────────────────────────────────────

const W         = 30    // half-width  → 60 total
const D         = 24    // half-depth  → 48 total
const H         = 9     // ceiling height
const ROW_X     = [-22, -11, 0, 11, 22]
const SHELF_Z   = -6    // centre of shelf row
const SHELF_LEN = 30    // z = -21 to z = 9  (front z=10+ stays free)

export default function Warehouse({ playerPosRef, onCaught, onServerNear, onNearDoor, lockPicked }) {
  const floorTex = useMemo(() => makeConcreteFloor(), [])
  const wallTex  = useMemo(() => makeMetalWall(),     [])

  return (
    <group>
      <ambientLight intensity={0.6} color="#fff0d8" />

      {/* Ceiling lights — 3×4 grid, steady */}
      {[-18, 0, 18].flatMap(x =>
        [-16, -4, 8, 20].map(z => (
          <IndustrialLight key={`${x}-${z}`} position={[x, H - 0.05, z]} />
        ))
      )}

      {/* Emergency sign */}
      <group position={[0, H - 1.2, D - 0.5]}>
        <mesh><boxGeometry args={[2.2, 0.5, 0.08]} /><meshStandardMaterial color="#0a0a0a" /></mesh>
        <mesh position={[0, 0, 0.05]}><boxGeometry args={[2.0, 0.36, 0.02]} /><meshStandardMaterial color="#ff2020" emissive="#ff2020" emissiveIntensity={2} /></mesh>
        <pointLight position={[0, 0, 0.5]} color="#ff2020" intensity={5} distance={7} />
      </group>

      {/* Floor */}
      <RigidBody type="fixed">
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[W*2, D*2]} />
          <meshStandardMaterial map={floorTex} roughness={0.92} metalness={0.02} />
        </mesh>
        <CuboidCollider args={[W, 0.1, D]} position={[0, -0.1, 0]} />
      </RigidBody>

      {/* Ceiling */}
      <mesh rotation={[Math.PI/2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W*2, D*2]} />
        <meshStandardMaterial color="#1e1c1a" roughness={1} />
      </mesh>

      {/* Ceiling beams */}
      {[-16, -4, 8, 20].map(z => (
        <mesh key={`hb-${z}`} position={[0, H-0.22, z]}>
          <boxGeometry args={[W*2, 0.44, 0.32]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {[-18, 0, 18].map(x => (
        <mesh key={`vb-${x}`} position={[x, H-0.22, 0]}>
          <boxGeometry args={[0.32, 0.44, D*2]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* Walls */}
      <RigidBody type="fixed">
      {/* ── Back wall — two pieces either side of the server room doorway ── */}
      <RigidBody type="fixed">
        {/* Left of doorway */}
        <mesh position={[-16.25, H/2, -D]} receiveShadow>
          <boxGeometry args={[27.5, H, 0.2]} />
          <meshStandardMaterial map={wallTex} roughness={0.9} />
        </mesh>
        {/* Right of doorway */}
        <mesh position={[16.25, H/2, -D]} receiveShadow>
          <boxGeometry args={[27.5, H, 0.2]} />
          <meshStandardMaterial map={wallTex} roughness={0.9} />
        </mesh>
        {/* Lintel above doorway (warehouse side) */}
        <mesh position={[0, H-2.875, -D]}>
          <boxGeometry args={[5, H-5.75, 0.2]} />
          <meshStandardMaterial map={wallTex} roughness={0.9} />
        </mesh>
        <CuboidCollider args={[13.75, H/2, 0.1]} position={[-16.25, H/2, -D]} />
        <CuboidCollider args={[13.75, H/2, 0.1]} position={[ 16.25, H/2, -D]} />
      </RigidBody>
        <mesh position={[0, H/2, D]}>
          <boxGeometry args={[W*2, H, 0.2]} />
          <meshStandardMaterial map={wallTex} roughness={0.9} />
        </mesh>
        <mesh position={[-W, H/2, 0]} rotation={[0, Math.PI/2, 0]} receiveShadow>
          <boxGeometry args={[D*2, H, 0.2]} />
          <meshStandardMaterial map={wallTex} roughness={0.9} />
        </mesh>
        <mesh position={[W, H/2, 0]} rotation={[0, Math.PI/2, 0]}>
          <boxGeometry args={[D*2, H, 0.2]} />
          <meshStandardMaterial map={wallTex} roughness={0.9} />
        </mesh>
        <CuboidCollider args={[W, H/2, 0.1]} position={[0,  H/2, -D]} />
        <CuboidCollider args={[W, H/2, 0.1]} position={[0,  H/2,  D]} />
        <CuboidCollider args={[0.1, H/2, D]} position={[-W, H/2,  0]} />
        <CuboidCollider args={[0.1, H/2, D]} position={[W,  H/2,  0]} />
      </RigidBody>

      {/* Shelf rows */}
      {ROW_X.map(x => (
        <ShelfRow key={x} x={x} z={SHELF_Z} length={SHELF_LEN} />
      ))}

      {/* Shelf colliders — full depth (1.0) and full height */}
      <RigidBody type="fixed">
        {ROW_X.map(x => (
          <CuboidCollider key={x} args={[0.5, 2.35, SHELF_LEN/2]} position={[x, 2.35, SHELF_Z]} />
        ))}

        {/* Back-wall crate stacks */}
        <CuboidCollider args={[W - 1, 1.65, 0.65]} position={[0, 1.65, -22]} />

        {/* Side-wall crate stacks */}
        <CuboidCollider args={[0.65, 1.1, 14]} position={[-29, 1.1, -4]} />
        <CuboidCollider args={[0.65, 1.1, 14]} position={[ 29, 1.1, -4]} />

        {/* Row-end floor crate piles */}
        {ROW_X.map(x => (
          <CuboidCollider key={x} args={[0.9, 0.9, 1.2]} position={[x, 0.9, -20]} />
        ))}

        {/* Barrel clusters */}
        {[-16,-5,6].flatMap(z =>
          [-26,26].map(x => (
            <CuboidCollider key={`bc-${x}-${z}`} args={[0.32, 0.85, 0.32]} position={[x, 0.85, z]} />
          ))
        )}

        {/* Loading dock */}
        <CuboidCollider args={[7, 0.18, 3]} position={[0, 0.18, 20]} />
      </RigidBody>

      {/* Crates on shelves — gaps, wonky angles, occasional open lid */}
      {ROW_X.flatMap(x =>
        [-20,-18,-16,-14,-12,-10,-8,-6,-4,-2,0,2,4,6,8].flatMap(z =>
          [0.76, 1.72, 2.68, 3.64].flatMap(y => {
            const s  = x * 13.7 + z * 7.3 + y * 19.1
            // ~22% chance of a full gap at this slot
            if (sr(s) < 0.22) return []
            const results = []
            // First crate
            results.push(
              <Crate key={`${x}-${z}-${y}-a`}
                position={[x + (sr(s+1)-0.5)*0.14, y, z - 0.38 + (sr(s+2)-0.5)*0.18]}
                rotation={[0, (sr(s+3)-0.5)*0.28, (sr(s+4)-0.5)*0.09]}
                w={0.66} h={0.63} d={0.68}
                color={y > 2.5 ? '#4e3b0e' : '#7a5c18'}
                open={sr(s+5) < 0.12} />
            )
            // Second crate — skip ~28% of the time to leave gaps
            if (sr(s+6) > 0.28) {
              results.push(
                <Crate key={`${x}-${z}-${y}-b`}
                  position={[x + (sr(s+7)-0.5)*0.14, y, z + 0.38 + (sr(s+8)-0.5)*0.18]}
                  rotation={[0, (sr(s+9)-0.5)*0.28, (sr(s+10)-0.5)*0.09]}
                  w={0.63} h={0.60} d={0.66}
                  color={y > 2.5 ? '#5a4412' : '#8a6820'}
                  open={sr(s+11) < 0.10} />
              )
            }
            return results
          })
        )
      )}

      {/* Floor crates at back end of each row — every box is its own physics body */}
      {ROW_X.flatMap((x, ri) =>
        [-21, -19].map((z, zi) => [
          <PhysicsCrate key={`${x}-${z}-l`} position={[x - 0.6, 0.56, z]} labelV={(ri*6+zi*3)%5} />,
          <PhysicsCrate key={`${x}-${z}-r`} position={[x + 0.6, 0.56, z]} labelV={(ri*6+zi*3+1)%5} />,
          <PhysicsCrate key={`${x}-${z}-t`} position={[x,       1.66, z]} labelV={(ri*6+zi*3+2)%5} />,
        ])
      )}

      {/* Crate stacks along back wall — x=0 removed to keep doorway clear */}
      {[-24,-18,-12,-6,6,12,18,24].map((x, xi) => [
        <PhysicsCrate key={`bw-${x}-0`} position={[x, 0.56, -22]} labelV={xi%5} />,
        <PhysicsCrate key={`bw-${x}-1`} position={[x, 1.66, -22]} color="#5a4412" labelV={(xi+2)%5} />,
        <PhysicsCrate key={`bw-${x}-2`} position={[x, 2.76, -22]} color="#4e3b0e" labelV={(xi+4)%5} />,
      ])}

      {/* Crates along side walls — individual physics crates */}
      {[-18,-10,-2,6,14].flatMap((z, zi) => [
        <PhysicsCrate key={`lw-${z}-0`} position={[-29, 0.56, z]} labelV={zi%5} />,
        <PhysicsCrate key={`lw-${z}-1`} position={[-29, 1.66, z]} color="#5a4412" labelV={(zi+1)%5} />,
        <PhysicsCrate key={`rw-${z}-0`} position={[ 29, 0.56, z]} labelV={(zi+2)%5} />,
        <PhysicsCrate key={`rw-${z}-1`} position={[ 29, 1.66, z]} color="#5a4412" labelV={(zi+3)%5} />,
      ])}

      {/* Barrels in corner aisles */}
      {[-16,-5,6].flatMap(z =>
        [-26,26].map(x => (
          <group key={`bar-${x}-${z}`}>
            <Barrel position={[x, 0.42, z]} />
            <Barrel position={[x, 1.27, z]} />
          </group>
        ))
      )}

      {/* OmniArc Guards on patrol — each with a different speed, walk rate and start phase */}
      {GUARD_ROUTES.map((route, i) => (
        <Guard
          key={i}
          waypoints={route}
          speed={[1.5, 2.1, 1.7, 2.3, 1.6, 1.9][i]}
          walkFreq={[3.2, 4.1, 3.7, 4.5, 3.0, 3.9][i]}
          phaseOffset={[0, 1.1, 2.3, 0.7, 3.5, 1.8][i]}
          playerPosRef={playerPosRef}
          onCaught={onCaught}
          dialogPhrase={GUARD_DIALOG[i % GUARD_DIALOG.length]}
        />
      ))}

      {/* Server room — hidden behind the back wall */}
      <ServerRoom playerPosRef={playerPosRef} onServerNear={onServerNear} onNearDoor={onNearDoor} lockPicked={lockPicked} />
    </group>
  )
}
