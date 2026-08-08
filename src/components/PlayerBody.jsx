import { useRef, useMemo, forwardRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// ── Canvas-generated reptile scales texture ───────────────────────────────────
function makeScalesTexture(base = '#4a9830', scaleCol = '#387820') {
  const s = 256
  const c = document.createElement('canvas')
  c.width = s; c.height = s
  const ctx = c.getContext('2d')
  ctx.fillStyle = base; ctx.fillRect(0, 0, s, s)

  const sw = 22, sh = 16
  const rows = Math.ceil(s / sh) + 2
  const cols = Math.ceil(s / sw) + 2

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ox = row % 2 === 0 ? 0 : sw / 2
      const x  = col * sw + ox - sw / 2
      const y  = row * sh

      // Scale body — darker fill
      ctx.beginPath()
      ctx.arc(x, y, sw / 2 - 0.5, 0, Math.PI)
      ctx.fillStyle = scaleCol; ctx.fill()

      // Scale rim — darkest edge
      ctx.beginPath()
      ctx.arc(x, y, sw / 2 - 0.5, 0, Math.PI)
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'
      ctx.lineWidth = 1.8; ctx.stroke()

      // Highlight near top of each scale
      ctx.beginPath()
      ctx.arc(x, y - 3, sw / 2 - 4, 0.1, Math.PI - 0.1)
      ctx.strokeStyle = 'rgba(80,160,50,0.25)'
      ctx.lineWidth = 1.2; ctx.stroke()
    }
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

// ── Dino hand (forwardRef so parent can animate it) ─────────────────────────────
const DinoHand = forwardRef(function DinoHand({ scalesTex }, ref) {
  return (
    <group ref={ref} position={[0, 0.14, 0]}>
      {/* Palm */}
      <RoundedBox args={[0.072, 0.05, 0.065]} radius={0.014} castShadow>
        <meshStandardMaterial map={scalesTex} color="#6dc43e" roughness={0.75} />
      </RoundedBox>

      {/* 3 tiny fingers */}
      {[
        { x: -0.014, angle: 0.15 },
        { x:  0,      angle: 0 },
        { x:  0.014,  angle: -0.15 },
      ].map(({ x, angle }, i) => (
        <group key={i} position={[x, -0.025, 0.022]} rotation={[-0.35, angle, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.007, 0.006, 0.022, 6]} />
            <meshStandardMaterial map={scalesTex} color="#6dc43e" roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.020, 0.006]} rotation={[-0.3, 0, 0]} castShadow>
            <cylinderGeometry args={[0.005, 0.004, 0.016, 6]} />
            <meshStandardMaterial map={scalesTex} color="#6dc43e" roughness={0.75} />
          </mesh>
          {/* Tiny claw */}
          <mesh position={[0, -0.034, 0.012]} rotation={[-1.2, 0, 0]} castShadow>
            <coneGeometry args={[0.002, 0.008, 5]} />
            <meshStandardMaterial color="#0e2808" roughness={0.45} />
          </mesh>
        </group>
      ))}
    </group>
  )
})

// ── PlayerBody ────────────────────────────────────────────────────────────────
export default function PlayerBody() {
  const { camera } = useThree()
  const ref        = useRef()
  const leftArm    = useRef()
  const rightArm   = useRef()
  const leftElbow  = useRef()
  const rightElbow = useRef()
  const leftHand   = useRef()
  const rightHand  = useRef()
  const tailRef    = useRef()
  const tailSeg2   = useRef()
  const tailSeg3   = useRef()
  const tailSeg4   = useRef()
  const tailSeg5   = useRef()
  const _dir      = new THREE.Vector3()
  const _prevPos  = new THREE.Vector3()
  const walkClock = useRef(0)

  // Build texture once, tile differently per body-part size
  const scalesBase = useMemo(() => makeScalesTexture(), [])
  const scalesLg   = useMemo(() => {
    const t = scalesBase.clone(); t.repeat.set(2.5, 5); t.needsUpdate = true; return t
  }, [scalesBase])
  const scalesSm   = useMemo(() => {
    const t = scalesBase.clone(); t.repeat.set(1.5, 3); t.needsUpdate = true; return t
  }, [scalesBase])

  useFrame((state, delta) => {
    if (!ref.current) return

    camera.getWorldDirection(_dir)

    ref.current.position.set(
      camera.position.x,
      camera.position.y - 0.44,
      camera.position.z
    )
    ref.current.rotation.y = Math.atan2(_dir.x, _dir.z)

    const moving = _prevPos.distanceTo(camera.position) > 0.003
    _prevPos.copy(camera.position)

    walkClock.current += delta * (moving ? 9 : 1.2)
    const swing = moving
      ? Math.sin(walkClock.current) * 0.55
      : Math.sin(walkClock.current) * 0.06

    if (leftArm.current)  leftArm.current.rotation.x =  0.3 + swing
    if (rightArm.current) rightArm.current.rotation.x =  0.3 - swing

    // Elbow bend — forearm hinges forward when arm swings forward, extends back in line
    const elbowTarget = moving
      ? Math.sin(walkClock.current) * 0.55 + 0.15  // swings from slight bend to more bent
      : 0.05                                         // nearly straight at rest

    if (leftElbow.current) {
      leftElbow.current.rotation.x += (elbowTarget - leftElbow.current.rotation.x) * 0.14
    }
    if (rightElbow.current) {
      const rightTarget = moving ? -Math.sin(walkClock.current) * 0.55 + 0.15 : 0.05
      rightElbow.current.rotation.x += (rightTarget - rightElbow.current.rotation.x) * 0.14
    }

    // Tail animation — swish side to side and bob up/down with wave through segments
    const swishTarget = moving
      ? Math.sin(walkClock.current * 0.65) * 0.35
      : Math.sin(walkClock.current * 0.4) * 0.18
    const bobTarget = moving
      ? Math.sin(walkClock.current * 0.8) * 0.10
      : Math.sin(walkClock.current * 0.5) * 0.05
    if (tailRef.current) {
      // Side-to-side swish (y-axis)
      tailRef.current.rotation.y += (swishTarget - tailRef.current.rotation.y) * 0.1
      // Up-down bob (x-axis) — subtle vertical motion
      tailRef.current.rotation.x += (bobTarget - tailRef.current.rotation.x) * 0.08
    }
    
    // Wave motion through tail segments — each follows with phase delay
    const waveSpeed = moving ? 0.7 : 0.4
    if (tailSeg2.current) {
      const target = 0.22 + Math.sin(walkClock.current * waveSpeed + 0.4) * 0.12
      tailSeg2.current.rotation.x += (target - tailSeg2.current.rotation.x) * 0.12
    }
    if (tailSeg3.current) {
      const target = 0.22 + Math.sin(walkClock.current * waveSpeed + 0.8) * 0.14
      tailSeg3.current.rotation.x += (target - tailSeg3.current.rotation.x) * 0.12
    }
    if (tailSeg4.current) {
      const target = 0.22 + Math.sin(walkClock.current * waveSpeed + 1.2) * 0.16
      tailSeg4.current.rotation.x += (target - tailSeg4.current.rotation.x) * 0.12
    }
    if (tailSeg5.current) {
      const target = 0.20 + Math.sin(walkClock.current * waveSpeed + 1.6) * 0.18
      tailSeg5.current.rotation.x += (target - tailSeg5.current.rotation.x) * 0.12
    }
    const handSwing = moving
      ? Math.sin(walkClock.current * 0.7 + Math.PI / 2) * 0.3
      : Math.sin(walkClock.current * 0.8) * 0.04
    const handCurl = moving
      ? Math.sin(walkClock.current * 0.7) * 0.15
      : 0

    if (leftHand.current) {
      leftHand.current.rotation.x += (handSwing - leftHand.current.rotation.x) * 0.12
      leftHand.current.rotation.z += (handCurl  - leftHand.current.rotation.z) * 0.12
    }
    if (rightHand.current) {
      rightHand.current.rotation.x += (-handSwing - rightHand.current.rotation.x) * 0.12
      rightHand.current.rotation.z += (-handCurl  - rightHand.current.rotation.z) * 0.12
    }
  })

  return (
    <group ref={ref}>

      {/* ── TORSO ── */}
      <RoundedBox position={[0, 0.04, 0]} args={[0.22, 0.42, 0.16]} radius={0.04} castShadow>
        <meshStandardMaterial map={scalesLg} color="#4a9830" roughness={0.82} />
      </RoundedBox>

      {/* Belly — no scales, smooth cream */}
      <mesh position={[0, -0.02, 0.07]} castShadow>
        <sphereGeometry args={[0.09, 14, 10]} />
        <meshStandardMaterial color="#c8b86e" roughness={0.9} />
      </mesh>

      {/* Spine ridge */}
      {[0.16, 0.09, 0.01, -0.07, -0.14].map((y, i) => (
        <mesh key={i} position={[0, y, -0.08]} castShadow>
          <coneGeometry args={[0.016 + i * 0.002, 0.052, 6]} />
          <meshStandardMaterial color="#1a4010" roughness={0.75} />
        </mesh>
      ))}

      {/* Chest armour */}
      <RoundedBox position={[0, 0.06, 0.07]} args={[0.15, 0.24, 0.05]} radius={0.02} castShadow>
        <meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.06, 0.1]}>
        <boxGeometry args={[0.04, 0.14, 0.006]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.2} />
      </mesh>

      {/* ── LEFT ARM ── */}
      <group ref={leftArm} position={[0.08, 0.12, 0.01]}>
        <group rotation={[0.05, 0.05, -Math.PI * 0.75]}>
          <mesh position={[0, 0.09, 0]} castShadow>
            <cylinderGeometry args={[0.028, 0.024, 0.18, 12]} />
            <meshStandardMaterial map={scalesSm} color="#4a9830" roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.18, 0]} castShadow>
            <sphereGeometry args={[0.026, 10, 10]} />
            <meshStandardMaterial map={scalesSm} color="#3a8025" roughness={0.8} />
          </mesh>
          <group ref={leftElbow} position={[0, 0.18, 0]}>
            <mesh position={[0, 0.07, 0]} castShadow>
              <cylinderGeometry args={[0.022, 0.018, 0.14, 12]} />
              <meshStandardMaterial map={scalesSm} color="#4a9830" roughness={0.82} />
            </mesh>
            <DinoHand ref={leftHand} scalesTex={scalesSm} />
          </group>
        </group>
      </group>

      {/* ── RIGHT ARM ── */}
      <group ref={rightArm} position={[-0.08, 0.12, 0.01]}>
        <group rotation={[0.05, -0.05, Math.PI * 0.75]}>
          <mesh position={[0, 0.09, 0]} castShadow>
            <cylinderGeometry args={[0.028, 0.024, 0.18, 12]} />
            <meshStandardMaterial map={scalesSm} color="#4a9830" roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.18, 0]} castShadow>
            <sphereGeometry args={[0.026, 10, 10]} />
            <meshStandardMaterial map={scalesSm} color="#3a8025" roughness={0.8} />
          </mesh>
          <group ref={rightElbow} position={[0, 0.18, 0]}>
            <mesh position={[0, 0.07, 0]} castShadow>
              <cylinderGeometry args={[0.022, 0.018, 0.14, 12]} />
              <meshStandardMaterial map={scalesSm} color="#4a9830" roughness={0.82} />
            </mesh>
            <DinoHand ref={rightHand} scalesTex={scalesSm} />
          </group>
        </group>
      </group>

      {/* ── TAIL — exits body at 90° backward, curves up ── */}
      <group ref={tailRef} position={[0, -0.17, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Seg 1 — widest, base half-embedded */}
        <mesh position={[0, -0.10, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.047, 0.20, 12]} />
          <meshStandardMaterial map={scalesSm} color="#4a9830" roughness={0.82} />
        </mesh>
        {/* Seg 2 — curves up (+x = upward in this rotated space) */}
        <group ref={tailSeg2} position={[0, -0.21, 0]} rotation={[0.22, 0, 0]}>
          <mesh position={[0, -0.10, 0]} castShadow>
            <cylinderGeometry args={[0.044, 0.035, 0.20, 12]} />
            <meshStandardMaterial map={scalesSm} color="#4a9830" roughness={0.82} />
          </mesh>
          {/* Seg 3 */}
          <group ref={tailSeg3} position={[0, -0.21, 0]} rotation={[0.22, 0, 0]}>
            <mesh position={[0, -0.10, 0]} castShadow>
              <cylinderGeometry args={[0.032, 0.024, 0.20, 12]} />
              <meshStandardMaterial map={scalesSm} color="#4a9830" roughness={0.82} />
            </mesh>
            {/* Seg 4 */}
            <group ref={tailSeg4} position={[0, -0.21, 0]} rotation={[0.22, 0, 0]}>
              <mesh position={[0, -0.09, 0]} castShadow>
                <cylinderGeometry args={[0.020, 0.013, 0.18, 12]} />
                <meshStandardMaterial color="#3a8025" roughness={0.85} />
              </mesh>
              {/* Seg 5 — slim taper */}
              <group ref={tailSeg5} position={[0, -0.19, 0]} rotation={[0.20, 0, 0]}>
                <mesh position={[0, -0.08, 0]} castShadow>
                  <cylinderGeometry args={[0.010, 0.004, 0.16, 10]} />
                  <meshStandardMaterial color="#2e6a1e" roughness={0.85} />
                </mesh>
                {/* Sharp point */}
                <mesh position={[0, -0.20, 0]} rotation={[Math.PI, 0, 0]} castShadow>
                  <coneGeometry args={[0.004, 0.10, 8]} />
                  <meshStandardMaterial color="#1a4010" roughness={0.5} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* ── LEGS ── */}
      {[-0.07, 0.07].map((x, i) => (
        <group key={i} position={[x, -0.26, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.038, 0.03, 0.24, 10]} />
            <meshStandardMaterial map={scalesSm} color="#4a9830" roughness={0.82} />
          </mesh>
          <mesh position={[0, -0.2, 0.03]} rotation={[0.2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.028, 0.02, 0.22, 10]} />
            <meshStandardMaterial map={scalesSm} color="#3e8428" roughness={0.82} />
          </mesh>
          {[-0.018, 0, 0.018].map((fx, fi) => (
            <mesh key={fi} position={[fx, -0.35, 0.06]} rotation={[0.6, 0, 0]} castShadow>
              <coneGeometry args={[0.01, 0.045, 5]} />
              <meshStandardMaterial color="#0e2808" roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
