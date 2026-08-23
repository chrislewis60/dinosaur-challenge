import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// ── Floor & Wall Texture Generators ───────────────────────────────────────────

function makePoliceFloor() {
  const s = 512, c = document.createElement('canvas')
  c.width = s; c.height = s
  const ctx = c.getContext('2d')
  
  // Lighter grey tiles
  ctx.fillStyle = '#4a4d54'
  ctx.fillRect(0, 0, s, s)
  
  // Tile pattern
  const tileSize = 64
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'
  ctx.lineWidth = 2
  for (let i = 0; i <= s; i += tileSize) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, s)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(s, i)
    ctx.stroke()
  }
  
  // Dirt and scuffs
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * s
    const y = Math.random() * s
    const r = Math.random() * 40 + 10
    ctx.fillStyle = `rgba(30,30,30,${0.1 + Math.random() * 0.15})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 4)
  return tex
}

function makeWallTexture() {
  const s = 512, c = document.createElement('canvas')
  c.width = s; c.height = s
  const ctx = c.getContext('2d')
  
  // Lighter institutional wall
  ctx.fillStyle = '#3a3f48'
  ctx.fillRect(0, 0, s, s)
  
  // Subtle concrete texture
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * s
    const y = Math.random() * s
    ctx.fillStyle = `rgba(50,55,60,${Math.random() * 0.3})`
    ctx.fillRect(x, y, Math.random() * 3, Math.random() * 3)
  }
  
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 1)
  return tex
}

// ── Security Camera ────────────────────────────────────────────────────────────

function SecurityCamera({ position, rotation = 0 }) {
  const camRef = useRef()
  
  useFrame(({ clock }) => {
    if (!camRef.current) return
    // Slow pan back and forth
    camRef.current.rotation.y = rotation + Math.sin(clock.elapsedTime * 0.8) * 0.6
  })
  
  return (
    <group position={position} ref={camRef}>
      {/* Camera body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.25, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Lens */}
      <mesh position={[0, 0, 0.15]} castShadow>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#050505" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Red recording light */}
      <mesh position={[0, 0.14, 0.1]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial 
          color="#ff0000" 
          emissive="#ff0000" 
          emissiveIntensity={2} 
        />
      </mesh>
      <pointLight position={[0, 0.14, 0.1]} color="#ff0000" intensity={0.5} distance={1} />
    </group>
  )
}

// ── Office Door ────────────────────────────────────────────────────────────────

function OfficeDoor({ position, rotation = 0, label = "OFFICE" }) {
  return (
    <RigidBody type="fixed" position={position} rotation={[0, rotation, 0]}>
      <CuboidCollider args={[0.05, 1.2, 0.45]} />
      <group>
        {/* Door */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.1, 2.4, 0.9]} />
          <meshStandardMaterial color="#2d2520" roughness={0.7} metalness={0.2} />
        </mesh>
        {/* Door window */}
        <mesh position={[0.06, 0.5, 0]}>
          <boxGeometry args={[0.02, 0.6, 0.4]} />
          <meshStandardMaterial 
            color="#1a2030" 
            transparent 
            opacity={0.4} 
            metalness={0.9} 
            roughness={0.1} 
          />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.08, 0, 0.35]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Door label */}
        <Text
          position={[0.12, 1.2, 0]}
          fontSize={0.12}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.8}
        >
          {label}
        </Text>
      </group>
    </RigidBody>
  )
}

// ── Evidence Locker ────────────────────────────────────────────────────────────

function EvidenceLocker({ position }) {
  return (
    <RigidBody type="fixed" position={position}>
      <CuboidCollider args={[0.4, 1.0, 0.3]} />
      <group>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8, 2.0, 0.6]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Wire mesh front */}
        <mesh position={[0.31, 0, 0]}>
          <boxGeometry args={[0.02, 1.8, 0.5]} />
          <meshStandardMaterial 
            color="#666" 
            metalness={0.8} 
            roughness={0.3} 
            wireframe={true} 
          />
        </mesh>
        {/* Padlock */}
        <mesh position={[0.35, -0.4, 0]} castShadow>
          <boxGeometry args={[0.08, 0.12, 0.04]} />
          <meshStandardMaterial color="#ffcc00" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </RigidBody>
  )
}

// ── Guard (patrolling officer) ─────────────────────────────────────────────────

const GUARD_ROUTES = [
  // Main hallway patrol
  [{ x: 0, z: -20 }, { x: 0, z: 20 }],
  // Forward patrol
  [{ x: 0, z: -15 }, { x: 0, z: 10 }],
  // Back patrol
  [{ x: 0, z: 5 }, { x: 0, z: -25 }],
]

function Guard({ waypoints, speed = 1.5, playerPosRef, onCaught }) {
  const groupRef = useRef()
  const detectedRef = useRef(false)
  const wpIdx = useRef(0)
  const waitTimer = useRef(0)
  const isWaiting = useRef(false)
  
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    if (isWaiting.current) {
      waitTimer.current -= delta
      if (waitTimer.current <= 0) {
        isWaiting.current = false
        wpIdx.current = (wpIdx.current + 1) % waypoints.length
      }
      return
    }
    
    const target = waypoints[wpIdx.current]
    const pos = groupRef.current.position
    const dx = target.x - pos.x
    const dz = target.z - pos.z
    const distSq = dx * dx + dz * dz
    
    if (distSq < 0.1) {
      isWaiting.current = true
      waitTimer.current = 2
      return
    }
    
    const dist = Math.sqrt(distSq)
    pos.x += (dx / dist) * speed * delta
    pos.z += (dz / dist) * speed * delta
    
    // Smooth rotation
    const targetY = Math.atan2(dx, dz)
    let diff = targetY - groupRef.current.rotation.y
    if (diff > Math.PI) diff -= Math.PI * 2
    if (diff < -Math.PI) diff += Math.PI * 2
    groupRef.current.rotation.y += diff * Math.min(1, delta * 6)
    
    // Detection with line-of-sight
    if (playerPosRef && !detectedRef.current) {
      const px = playerPosRef.current.x
      const pz = playerPosRef.current.z
      const gx = groupRef.current.position.x
      const gz = groupRef.current.position.z
      const pdx = px - gx
      const pdz = pz - gz
      const pdistSq = pdx * pdx + pdz * pdz
      
      let spotted = false
      
      // Very close - always detected
      if (pdistSq < 2.25) {
        spotted = true
      }
      // Vision cone
      else if (pdistSq < 49) {
        const facing = groupRef.current.rotation.y
        let diff = Math.atan2(pdx, pdz) - facing
        if (diff > Math.PI) diff -= Math.PI * 2
        if (diff < -Math.PI) diff += Math.PI * 2
        if (Math.abs(diff) < 0.7) {
          spotted = true
        }
      }
      
      if (spotted) {
        detectedRef.current = true
        onCaught?.()
      }
    }
  })
  
  return (
    <group ref={groupRef} position={[waypoints[0].x, 0, waypoints[0].z]}>
      {/* Body - police uniform */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.3, 1.2, 16]} />
        <meshStandardMaterial color="#1a1a3a" roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#d4a574" roughness={0.9} />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.15, 16]} />
        <meshStandardMaterial color="#1a1a3a" roughness={0.7} />
      </mesh>
      {/* Cap visor */}
      <mesh position={[0, 1.95, 0.2]} castShadow>
        <boxGeometry args={[0.3, 0.02, 0.15]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.5} />
      </mesh>
      {/* Flashlight */}
      <mesh position={[0.35, 1.0, 0.3]} castShadow rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.04, 0.04, 0.25, 12]} />
        <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Flashlight beam */}
      <spotLight
        position={[0.35, 1.0, 0.45]}
        angle={0.4}
        penumbra={0.5}
        intensity={8}
        distance={8}
        color="#ffffaa"
        castShadow
      />
    </group>
  )
}

// ── Server Terminal ────────────────────────────────────────────────────────────

function ServerTerminal({ position, playerPosRef, onServerNear }) {
  useFrame(() => {
    if (!playerPosRef) return
    const px = playerPosRef.current.x
    const pz = playerPosRef.current.z
    const dist = Math.sqrt((px - position[0]) ** 2 + (pz - position[2]) ** 2)
    onServerNear?.(dist < 2)
  })
  
  return (
    <group position={position}>
      {/* Terminal base - NO COLLISION */}
      <mesh castShadow={false} receiveShadow={false}>
        <boxGeometry args={[0.7, 1.0, 0.5]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.6} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.05]} />
        <meshStandardMaterial 
          color="#002200" 
          emissive="#00ff00" 
          emissiveIntensity={0.5} 
        />
      </mesh>
      {/* Screen glow */}
      <pointLight position={[0, 0.55, 0.1]} color="#00ff00" intensity={1.5} distance={2} />
    </group>
  )
}

// ── Main Police Station Component ─────────────────────────────────────────────

export default function PoliceStation({ playerPosRef, onCaught, onServerNear }) {
  const floorTex = useMemo(() => makePoliceFloor(), [])
  const wallTex = useMemo(() => makeWallTexture(), [])
  
  const W = 6   // Hallway width (narrower)
  const H = 3.5 // Hallway height
  const L = 50  // Hallway length (longer)
  
  return (
    <group>
      <ambientLight intensity={1.5} color="#e8f0ff" />
      <directionalLight position={[0, 10, 0]} intensity={2} castShadow={false} />
      
      {/* Floor */}
      <RigidBody type="fixed">
        <CuboidCollider args={[W / 2, 0.1, L / 2]} position={[0, -0.1, 0]} />
        <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[W, L]} />
          <meshStandardMaterial map={floorTex} roughness={0.9} />
        </mesh>
      </RigidBody>
      
      {/* Ceiling */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow={false} castShadow={false}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color="#4a4d50" roughness={0.8} />
      </mesh>
      
      {/* Left wall */}
      <RigidBody type="fixed">
        <CuboidCollider args={[0.5, H / 2, L / 2]} position={[-W / 2, H / 2, 0]} />
        <mesh position={[-W / 2, H / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.0, H, L]} />
          <meshStandardMaterial map={wallTex} />
        </mesh>
      </RigidBody>
      
      {/* Right wall */}
      <RigidBody type="fixed">
        <CuboidCollider args={[0.5, H / 2, L / 2]} position={[W / 2, H / 2, 0]} />
        <mesh position={[W / 2, H / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.0, H, L]} />
          <meshStandardMaterial map={wallTex} />
        </mesh>
      </RigidBody>
      
      {/* Back wall */}
      <RigidBody type="fixed">
        <CuboidCollider args={[W / 2, H / 2, 0.5]} position={[0, H / 2, -L / 2]} />
        <mesh position={[0, H / 2, -L / 2]} receiveShadow castShadow>
          <boxGeometry args={[W, H, 1.0]} />
          <meshStandardMaterial map={wallTex} />
        </mesh>
      </RigidBody>
      
      {/* Wall decorations - Police signs and stripes */}
      {/* Warning stripes on left wall */}
      <mesh position={[-W / 2 + 0.51, 1.5, -10]}>
        <planeGeometry args={[0.1, 3.0]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>
      <mesh position={[-W / 2 + 0.51, 1.5, 0]}>
        <planeGeometry args={[0.1, 3.0]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>
      
      {/* Warning stripes on right wall */}
      <mesh position={[W / 2 - 0.51, 1.5, -10]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.1, 3.0]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>
      <mesh position={[W / 2 - 0.51, 1.5, 0]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.1, 3.0]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>
      
      {/* Police badge/emblem on left wall */}
      <mesh position={[-W / 2 + 0.51, 2.0, 5]}>
        <circleGeometry args={[0.3, 6]} />
        <meshStandardMaterial color="#1a4d8f" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Police badge/emblem on right wall */}
      <mesh position={[W / 2 - 0.51, 2.0, 5]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.3, 6]} />
        <meshStandardMaterial color="#1a4d8f" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Warning signs */}
      <mesh position={[-W / 2 + 0.51, 1.8, -18]}>
        <boxGeometry args={[0.6, 0.6, 0.02]} />
        <meshStandardMaterial color="#cc0000" />
      </mesh>
      
      <mesh position={[W / 2 - 0.51, 1.8, -18]} rotation={[0, Math.PI, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.02]} />
        <meshStandardMaterial color="#cc0000" />
      </mesh>
      
      {/* Server terminal - objective location - NO COLLISION */}
      <group position={[0, 0, -20]}>
        <ServerTerminal 
          position={[0, 0, 0]} 
          playerPosRef={playerPosRef}
          onServerNear={onServerNear}
        />
      </group>
      
      {/* Dinosaur pictures on left wall */}
      <mesh position={[-W / 2 + 0.51, 2.0, 15]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[-W / 2 + 0.52, 2.0, 15]}>
        <planeGeometry args={[1.0, 0.7]} />
        <meshStandardMaterial color="#90EE90" />
      </mesh>
      
      <mesh position={[-W / 2 + 0.51, 2.0, -5]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[-W / 2 + 0.52, 2.0, -5]}>
        <planeGeometry args={[1.0, 0.7]} />
        <meshStandardMaterial color="#FF6B6B" />
      </mesh>
      
      {/* Dinosaur pictures on right wall */}
      <mesh position={[W / 2 - 0.51, 2.0, 15]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[W / 2 - 0.52, 2.0, 15]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.0, 0.7]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
      
      <mesh position={[W / 2 - 0.51, 2.0, -5]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[W / 2 - 0.52, 2.0, -5]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.0, 0.7]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>
      
      {/* Office doors on left wall */}
      <mesh position={[-W / 2 + 0.51, 1.2, -15]}>
        <planeGeometry args={[0.9, 2.2]} />
        <meshStandardMaterial color="#2d2520" />
      </mesh>
      <mesh position={[-W / 2 + 0.52, 1.2, -14.7]}>
        <planeGeometry args={[0.4, 0.6]} />
        <meshStandardMaterial color="#1a2030" transparent opacity={0.4} />
      </mesh>
      
      <mesh position={[-W / 2 + 0.51, 1.2, 8]}>
        <planeGeometry args={[0.9, 2.2]} />
        <meshStandardMaterial color="#2d2520" />
      </mesh>
      <mesh position={[-W / 2 + 0.52, 1.2, 8.3]}>
        <planeGeometry args={[0.4, 0.6]} />
        <meshStandardMaterial color="#1a2030" transparent opacity={0.4} />
      </mesh>
      
      {/* Office doors on right wall */}
      <mesh position={[W / 2 - 0.51, 1.2, -15]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.9, 2.2]} />
        <meshStandardMaterial color="#2d2520" />
      </mesh>
      <mesh position={[W / 2 - 0.52, 1.2, -14.7]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.4, 0.6]} />
        <meshStandardMaterial color="#1a2030" transparent opacity={0.4} />
      </mesh>
      
      <mesh position={[W / 2 - 0.51, 1.2, 8]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.9, 2.2]} />
        <meshStandardMaterial color="#2d2520" />
      </mesh>
      <mesh position={[W / 2 - 0.52, 1.2, 8.3]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.4, 0.6]} />
        <meshStandardMaterial color="#1a2030" transparent opacity={0.4} />
      </mesh>
    </group>
  )
}
