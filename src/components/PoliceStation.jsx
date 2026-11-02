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

  // Base industrial wall tone
  const grad = ctx.createLinearGradient(0, 0, 0, s)
  grad.addColorStop(0, '#40464e')
  grad.addColorStop(0.55, '#30353d')
  grad.addColorStop(1, '#262b31')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, s, s)

  // Heavy grime and scuffs
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * s
    const y = Math.random() * s
    const w = Math.random() * 28 + 5
    const h = Math.random() * 18 + 4
    ctx.fillStyle = `rgba(15,18,22,${0.18 + Math.random() * 0.25})`
    ctx.fillRect(x, y, w, h)
  }

  // Subtle concrete noise / patches
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * s
    const y = Math.random() * s
    ctx.fillStyle = `rgba(110,120,130,${0.05 + Math.random() * 0.12})`
    ctx.fillRect(x, y, Math.random() * 6 + 2, Math.random() * 6 + 2)
  }

  // Warm light stains similar to a worn arcade room
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * s
    const y = Math.random() * s
    const r = Math.random() * 80 + 30
    const g1 = ctx.createRadialGradient(x, y, 0, x, y, r)
    g1.addColorStop(0, `rgba(255, 200, 80, ${0.035 + Math.random() * 0.04})`)
    g1.addColorStop(1, 'rgba(255, 200, 80, 0)')
    ctx.fillStyle = g1
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Slight blue industrial lighting wash
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * s
    const y = Math.random() * s
    const r = Math.random() * 100 + 40
    const g2 = ctx.createRadialGradient(x, y, 0, x, y, r)
    g2.addColorStop(0, `rgba(110, 180, 255, ${0.025 + Math.random() * 0.03})`)
    g2.addColorStop(1, 'rgba(110,180,255,0)')
    ctx.fillStyle = g2
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Thin horizontal streaks to mimic old arcade walls
  for (let i = 0; i < 18; i++) {
    const y = Math.random() * s
    ctx.strokeStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.04})`
    ctx.lineWidth = Math.random() * 1.5 + 0.5
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(s, y + Math.random() * 8 - 4)
    ctx.stroke()
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
  const torsoRef = useRef()
  const headRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const leftElbowRef = useRef()
  const rightElbowRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
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

    const targetY = Math.atan2(dx, dz)
    let diff = targetY - groupRef.current.rotation.y
    if (diff > Math.PI) diff -= Math.PI * 2
    if (diff < -Math.PI) diff += Math.PI * 2
    groupRef.current.rotation.y += diff * Math.min(1, delta * 6)

    if (playerPosRef && !detectedRef.current) {
      const px = playerPosRef.current.x
      const pz = playerPosRef.current.z
      const gx = groupRef.current.position.x
      const gz = groupRef.current.position.z
      const pdx = px - gx
      const pdz = pz - gz
      const pdistSq = pdx * pdx + pdz * pdz

      let spotted = false
      if (pdistSq < 2.25) {
        spotted = true
      } else if (pdistSq < 49) {
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

    const walk = Math.sin(state.clock.elapsedTime * 2.2)
    const armSwing = walk * 0.52
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = armSwing
      leftArmRef.current.rotation.z = 0.12
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = -armSwing
      rightArmRef.current.rotation.z = -0.12
    }
    if (leftElbowRef.current) leftElbowRef.current.rotation.x = 0.9 + armSwing * 0.3
    if (rightElbowRef.current) rightElbowRef.current.rotation.x = 0.9 - armSwing * 0.3
    if (leftLegRef.current) leftLegRef.current.rotation.x = -walk * 0.18
    if (rightLegRef.current) rightLegRef.current.rotation.x = walk * 0.18
    if (torsoRef.current) torsoRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.025
    if (headRef.current) headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.1
  })

  return (
    <group ref={groupRef} position={[waypoints[0].x, 0, waypoints[0].z]}>
      <group ref={torsoRef}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.52, 0.36, 0.28]} />
          <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.62, 0.17]} castShadow>
          <boxGeometry args={[0.36, 0.22, 0.08]} />
          <meshStandardMaterial color="#6b8f5a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.86, -0.06]} castShadow>
          <coneGeometry args={[0.12, 0.18, 8]} />
          <meshStandardMaterial color="#2a4020" roughness={0.8} />
        </mesh>
        <mesh position={[-0.2, 1.05, 0.12]} rotation={[0, 0, 0.55]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.25, 8]} />
          <meshStandardMaterial color="#3d5c2e" roughness={0.8} />
        </mesh>
        <mesh position={[0.2, 1.05, 0.12]} rotation={[0, 0, -0.55]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.25, 8]} />
          <meshStandardMaterial color="#3d5c2e" roughness={0.8} />
        </mesh>
        <mesh position={[-0.22, 0.88, -0.04]} castShadow>
          <boxGeometry args={[0.1, 0.16, 0.1]} />
          <meshStandardMaterial color="#2a4020" roughness={0.8} />
        </mesh>
        <mesh position={[0.22, 0.88, -0.04]} castShadow>
          <boxGeometry args={[0.1, 0.16, 0.1]} />
          <meshStandardMaterial color="#2a4020" roughness={0.8} />
        </mesh>

        <mesh position={[0, 1.28, 0.14]} castShadow>
          <boxGeometry args={[0.34, 0.2, 0.22]} />
          <meshStandardMaterial color="#3d5c2e" roughness={0.8} />
        </mesh>
        <group ref={headRef} position={[0, 1.46, 0.32]}>
          <mesh castShadow>
            <sphereGeometry args={[0.17, 16, 16]} />
            <meshStandardMaterial color="#d4a574" roughness={0.9} />
          </mesh>
          <mesh position={[0.12, -0.02, 0.17]}>
            <boxGeometry args={[0.18, 0.08, 0.12]} />
            <meshStandardMaterial color="#b57f52" roughness={0.9} />
          </mesh>
          <mesh position={[0.2, 0.05, 0.17]}>
            <boxGeometry args={[0.04, 0.04, 0.03]} />
            <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[0.2, -0.06, 0.17]}>
            <boxGeometry args={[0.04, 0.04, 0.03]} />
            <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={1.5} />
          </mesh>
        </group>
      </group>

      <mesh position={[-0.22, 0.5, -0.2]} rotation={[0, 0, 0.1]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.48, 8]} />
        <meshStandardMaterial color="#2a4020" roughness={0.85} />
      </mesh>
      <mesh position={[0.22, 0.5, -0.2]} rotation={[0, 0, -0.1]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.48, 8]} />
        <meshStandardMaterial color="#2a4020" roughness={0.85} />
      </mesh>
      <mesh position={[-0.18, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.48, 8]} />
        <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
      </mesh>
      <mesh position={[0.18, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.48, 8]} />
        <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
      </mesh>
      <mesh position={[-0.18, -0.08, 0.12]} castShadow>
        <boxGeometry args={[0.09, 0.08, 0.18]} />
        <meshStandardMaterial color="#2a4020" roughness={0.85} />
      </mesh>
      <mesh position={[0.18, -0.08, 0.12]} castShadow>
        <boxGeometry args={[0.09, 0.08, 0.18]} />
        <meshStandardMaterial color="#2a4020" roughness={0.85} />
      </mesh>

      <mesh position={[0, 0.52, -0.34]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <coneGeometry args={[0.08, 0.30, 8]} />
        <meshStandardMaterial color="#2a4020" roughness={0.8} />
      </mesh>
      <group position={[-0.23, 0.9, 0.08]} rotation={[0.15, 0, 0.25]} ref={leftArmRef}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.04, 0.12, 6]} />
          <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
        </mesh>
        <group ref={leftElbowRef} position={[0, -0.08, 0]}>
          <mesh position={[0, -0.08, 0]} rotation={[0.85, 0, 0]} castShadow>
            <cylinderGeometry args={[0.036, 0.03, 0.18, 6]} />
            <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.17, 0.02]} castShadow>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshStandardMaterial color="#2a4020" roughness={0.8} />
          </mesh>
        </group>
      </group>
      <group position={[0.23, 0.9, 0.08]} rotation={[0.15, 0, -0.25]} ref={rightArmRef}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.04, 0.12, 6]} />
          <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
        </mesh>
        <group ref={rightElbowRef} position={[0, -0.08, 0]}>
          <mesh position={[0, -0.08, 0]} rotation={[0.85, 0, 0]} castShadow>
            <cylinderGeometry args={[0.036, 0.03, 0.18, 6]} />
            <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.17, 0.02]} castShadow>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshStandardMaterial color="#2a4020" roughness={0.8} />
          </mesh>
        </group>
      </group>
      <mesh position={[-0.18, 0.18, 0.1]} castShadow ref={leftLegRef}>
        <cylinderGeometry args={[0.07, 0.07, 0.42, 8]} />
        <meshStandardMaterial color="#3d5c2e" roughness={0.8} />
      </mesh>
      <mesh position={[0.18, 0.18, 0.1]} castShadow ref={rightLegRef}>
        <cylinderGeometry args={[0.07, 0.07, 0.42, 8]} />
        <meshStandardMaterial color="#3d5c2e" roughness={0.8} />
      </mesh>
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

function StationAlertGuard({ playerPosRef, basePos = [0, 0, -24.5], triggerRange = 5.5 }) {
  const guardRef = useRef()

  useFrame((_, delta) => {
    if (!guardRef.current || !playerPosRef) return

    const px = playerPosRef.current.x
    const pz = playerPosRef.current.z
    const dist = Math.hypot(px - basePos[0], pz - basePos[2])
    const shouldAlert = dist < triggerRange

    const sideStep = px >= 0 ? -1.2 : 1.2
    const targetX = shouldAlert ? sideStep : 0
    const targetRot = shouldAlert ? (sideStep < 0 ? Math.PI / 2 : -Math.PI / 2) : 0

    guardRef.current.position.x += (targetX - guardRef.current.position.x) * 0.02
    guardRef.current.position.z += (basePos[2] - guardRef.current.position.z) * 0.02
    const turnSpeed = 2.2
    const diff = THREE.MathUtils.euclideanModulo(targetRot - guardRef.current.rotation.y + Math.PI, Math.PI * 2) - Math.PI
    guardRef.current.rotation.y += diff * Math.min(1, delta * turnSpeed)
  })

  return (
    <group ref={guardRef} position={basePos}>
      <group position={[0, 0.1, 0]}>
        <group position={[0, 0.82, -0.08]} rotation={[Math.PI / 2.2, 0, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.07, 0.24, 10]} />
            <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.12, 0.04]} rotation={[0, 0, 0]}>
            <coneGeometry args={[0.04, 0.10, 5]} />
            <meshStandardMaterial color="#2a4020" roughness={0.8} />
          </mesh>
          <group position={[0, -0.25, 0]} rotation={[0.25, 0, 0]}>
            <mesh position={[0, -0.12, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.055, 0.24, 10]} />
              <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.12, 0.035]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.035, 0.09, 5]} />
              <meshStandardMaterial color="#2a4020" roughness={0.8} />
            </mesh>
            <group position={[0, -0.25, 0]} rotation={[0.25, 0, 0]}>
              <mesh position={[0, -0.11, 0]} castShadow>
                <cylinderGeometry args={[0.050, 0.040, 0.22, 10]} />
                <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
              </mesh>
              <mesh position={[0, -0.11, 0.03]} rotation={[0, 0, 0]}>
                <coneGeometry args={[0.03, 0.08, 5]} />
                <meshStandardMaterial color="#2a4020" roughness={0.8} />
              </mesh>
              <group position={[0, -0.23, 0]} rotation={[0.25, 0, 0]}>
                <mesh position={[0, -0.10, 0]} castShadow>
                  <cylinderGeometry args={[0.035, 0.025, 0.20, 10]} />
                  <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
                </mesh>
                <mesh position={[0, -0.10, 0.02]} rotation={[0, 0, 0]}>
                  <coneGeometry args={[0.025, 0.07, 5]} />
                  <meshStandardMaterial color="#2a4020" roughness={0.8} />
                </mesh>
                <group position={[0, -0.21, 0]} rotation={[0.22, 0, 0]}>
                  <mesh position={[0, -0.09, 0]} castShadow>
                    <cylinderGeometry args={[0.020, 0.012, 0.18, 8]} />
                    <meshStandardMaterial color="#2a4020" roughness={0.85} />
                  </mesh>
                  <mesh position={[0, -0.22, 0]} rotation={[Math.PI, 0, 0]} castShadow>
                    <coneGeometry args={[0.012, 0.12, 8]} />
                    <meshStandardMaterial color="#2a4020" roughness={0.7} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>

        <mesh position={[0, 0.88, 0]}>
          <boxGeometry args={[0.45, 0.12, 0.30]} />
          <meshStandardMaterial color="#2a4020" roughness={0.85} />
        </mesh>

        <group position={[-0.115, 0.80, 0]}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <cylinderGeometry args={[0.10, 0.085, 0.40, 8]} />
            <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
          </mesh>
          <group position={[0, -0.38, 0]}>
            <mesh position={[0, 0, 0.058]}>
              <boxGeometry args={[0.14, 0.11, 0.08]} />
              <meshStandardMaterial color="#2a4020" roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.19, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.07, 0.34, 8]} />
              <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.39, 0.06]} castShadow>
              <boxGeometry args={[0.14, 0.08, 0.18]} />
              <meshStandardMaterial color="#2a4020" roughness={0.9} />
            </mesh>
            {[-0.05, 0, 0.05].map((cx, ci) => (
              <mesh key={ci} position={[cx, -0.43, 0.16]} rotation={[0.3, 0, 0]}>
                <coneGeometry args={[0.02, 0.12, 4]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
              </mesh>
            ))}
            <mesh position={[0, -0.42, -0.08]} rotation={[-0.5, 0, 0]}>
              <coneGeometry args={[0.025, 0.10, 4]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
            </mesh>
          </group>
        </group>

        <group position={[0.115, 0.80, 0]}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <cylinderGeometry args={[0.10, 0.085, 0.40, 8]} />
            <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
          </mesh>
          <group position={[0, -0.38, 0]}>
            <mesh position={[0, 0, 0.058]}>
              <boxGeometry args={[0.14, 0.11, 0.08]} />
              <meshStandardMaterial color="#2a4020" roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.19, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.07, 0.34, 8]} />
              <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.39, 0.06]} castShadow>
              <boxGeometry args={[0.14, 0.08, 0.18]} />
              <meshStandardMaterial color="#2a4020" roughness={0.9} />
            </mesh>
            {[-0.05, 0, 0.05].map((cx, ci) => (
              <mesh key={ci} position={[cx, -0.43, 0.16]} rotation={[0.3, 0, 0]}>
                <coneGeometry args={[0.02, 0.12, 4]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
              </mesh>
            ))}
            <mesh position={[0, -0.42, -0.08]} rotation={[-0.5, 0, 0]}>
              <coneGeometry args={[0.025, 0.10, 4]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
            </mesh>
          </group>
        </group>

        <group position={[0, 0.92, 0]} rotation={[0.2, 0, 0]}>
          <mesh position={[0, 0.28, 0]} castShadow>
            <boxGeometry args={[0.42, 0.55, 0.35]} />
            <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.20, 0.18]}>
            <boxGeometry args={[0.35, 0.45, 0.02]} />
            <meshStandardMaterial color="#6b8f5a" roughness={0.9} />
          </mesh>
          {[0.15, 0.28, 0.41].map((ry, ri) => (
            <mesh key={ri} position={[0, ry, -0.15]} rotation={[0.3, 0, 0]}>
              <coneGeometry args={[0.06, 0.12, 4]} />
              <meshStandardMaterial color="#2a4020" roughness={0.8} />
            </mesh>
          ))}

          {[-0.24, 0.24].map((sx, si) => (
            <mesh key={si} position={[sx, 0.45, 0.08]}>
              <sphereGeometry args={[0.09, 8, 6]} />
              <meshStandardMaterial color="#2a4020" roughness={0.8} />
            </mesh>
          ))}

          <group position={[-0.30, 0.38, 0.10]}>
            <mesh position={[0, -0.12, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.04, 0.31, 6]} />
              <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.25, 0.03]} castShadow>
              <boxGeometry args={[0.09, 0.08, 0.06]} />
              <meshStandardMaterial color="#2a4020" roughness={0.9} />
            </mesh>
            <mesh position={[-0.025, -0.29, 0.05]} rotation={[0.4, 0.2, 0]}>
              <coneGeometry args={[0.014, 0.07, 4]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
            </mesh>
            <mesh position={[0.025, -0.29, 0.05]} rotation={[0.4, -0.2, 0]}>
              <coneGeometry args={[0.014, 0.07, 4]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
            </mesh>
          </group>

          <group position={[0.30, 0.38, 0.10]}>
            <mesh position={[0, -0.12, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.04, 0.31, 6]} />
              <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.25, 0.03]} castShadow>
              <boxGeometry args={[0.09, 0.08, 0.06]} />
              <meshStandardMaterial color="#2a4020" roughness={0.9} />
            </mesh>
            <mesh position={[-0.025, -0.29, 0.05]} rotation={[0.4, 0.2, 0]}>
              <coneGeometry args={[0.014, 0.07, 4]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
            </mesh>
            <mesh position={[0.025, -0.29, 0.05]} rotation={[0.4, -0.2, 0]}>
              <coneGeometry args={[0.014, 0.07, 4]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
            </mesh>
          </group>

          <mesh position={[0, 0.56, 0.10]} rotation={[-0.3, 0, 0]}>
            <cylinderGeometry args={[0.10, 0.12, 0.16, 8]} />
            <meshStandardMaterial color="#3d5c2e" roughness={0.8} />
          </mesh>

          <group position={[0, 0.68, 0.18]}>
            <mesh position={[0, 0.06, 0.16]} castShadow>
              <boxGeometry args={[0.22, 0.24, 0.40]} />
              <meshStandardMaterial color="#3d5c2e" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.02, 0.42]} castShadow>
              <boxGeometry args={[0.18, 0.18, 0.20]} />
              <meshStandardMaterial color="#3d5c2e" roughness={0.85} />
            </mesh>
            {[-0.05, 0.05].map((nx, ni) => (
              <mesh key={ni} position={[nx, 0.06, 0.52]}>
                <sphereGeometry args={[0.025, 6, 5]} />
                <meshStandardMaterial color="#000" roughness={0.9} />
              </mesh>
            ))}
            {[-0.07, -0.03, 0.01, 0.05].map((tx, ti) => (
              <mesh key={ti} position={[tx, -0.04, 0.44 + ti * 0.02]} rotation={[0.3, 0, 0]}>
                <coneGeometry args={[0.015, 0.06, 4]} />
                <meshStandardMaterial color="#e8e8e8" roughness={0.4} />
              </mesh>
            ))}
            <mesh position={[0, -0.08, 0.34]}>
              <boxGeometry args={[0.16, 0.08, 0.32]} />
              <meshStandardMaterial color="#2a4020" roughness={0.85} />
            </mesh>
            {[-0.09, 0.09].map((ex, ei) => (
              <mesh key={ei} position={[ex, 0.10, 0.32]}>
                <sphereGeometry args={[0.04, 8, 6]} />
                <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={2.0} />
              </mesh>
            ))}
            <mesh position={[0, 0.18, 0.08]} rotation={[-0.2, 0, 0]}>
              <boxGeometry args={[0.18, 0.08, 0.25]} />
              <meshStandardMaterial color="#2a4020" roughness={0.75} />
            </mesh>
            {[-0.08, 0.08].map((hx, hi) => (
              <mesh key={hi} position={[hx, 0.20, 0.20]} rotation={[-0.5, 0, hx > 0 ? -0.3 : 0.3]}>
                <coneGeometry args={[0.03, 0.10, 4]} />
                <meshStandardMaterial color="#2a4020" roughness={0.8} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  )
}

// ── Main Police Station Component ─────────────────────────────────────────────

export default function PoliceStation({ playerPosRef, onCaught, onServerNear }) {
  const floorTex = useMemo(() => makePoliceFloor(), [])
  const wallTex = useMemo(() => makeWallTexture(), [])
  
  const W = 6   // Hallway width (narrower)
  const H = 3.5 // Hallway height
  const L = 60  // Hallway stays long enough to allow a clear approach to the objective zone
  const wallCollisionDepth = 0.8
  
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
        <CuboidCollider args={[wallCollisionDepth, H / 2, L / 2]} position={[-W / 2, H / 2, 0]} />
        <mesh position={[-W / 2, H / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.0, H, L]} />
          <meshStandardMaterial map={wallTex} />
        </mesh>
      </RigidBody>
      
      {/* Right wall */}
      <RigidBody type="fixed">
        <CuboidCollider args={[wallCollisionDepth, H / 2, L / 2]} position={[W / 2, H / 2, 0]} />
        <mesh position={[W / 2, H / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[1.0, H, L]} />
          <meshStandardMaterial map={wallTex} />
        </mesh>
      </RigidBody>
      
      {/* Back wall */}
      <RigidBody type="fixed">
        <CuboidCollider args={[W / 2, H / 2, wallCollisionDepth]} position={[0, H / 2, -L / 2]} />
        <mesh position={[0, H / 2, -L / 2]} receiveShadow castShadow>
          <boxGeometry args={[W, H, 1.0]} />
          <meshStandardMaterial map={wallTex} />
        </mesh>
      </RigidBody>
      
      {/* Wall decorations - Police signs and stripes */}
      {/* Warning stripes on left wall — moved well off the central path */}
      <mesh position={[-W / 2 + 0.51, 1.5, -42]}>
        <planeGeometry args={[0.1, 3.0]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>
      <mesh position={[-W / 2 + 0.51, 1.5, -12]}>
        <planeGeometry args={[0.1, 3.0]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>
      
      {/* Warning stripes on right wall */}
      <mesh position={[W / 2 - 0.51, 1.5, -42]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.1, 3.0]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>
      <mesh position={[W / 2 - 0.51, 1.5, -12]} rotation={[0, Math.PI, 0]}>
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
      
      {/* Fixed warehouse guard directly in front of the terminal, using the same dinosaur proportions as the warehouse model */}
      <StationAlertGuard playerPosRef={playerPosRef} />

      {/* Server terminal - objective location - inside the corridor, not in the wall */}
      <ServerTerminal 
        position={[0, 0, -28]} 
        playerPosRef={playerPosRef}
        onServerNear={onServerNear}
      />
      
      {/* Dinosaur pictures on left wall */}
      <mesh position={[-W / 2 + 0.51, 2.0, 15]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[-W / 2 + 0.52, 2.0, 15]}>
        <planeGeometry args={[1.0, 0.7]} />
        <meshStandardMaterial color="#90EE90" />
      </mesh>
      
      <mesh position={[-W / 2 + 0.51, 2.0, -35]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[-W / 2 + 0.52, 2.0, -35]}>
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
      
      <mesh position={[W / 2 - 0.51, 2.0, -35]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[W / 2 - 0.52, 2.0, -35]} rotation={[0, Math.PI, 0]}>
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
