import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

export default function PlayerBody() {
  const { camera } = useThree()
  const ref = useRef()
  const _dir = new THREE.Vector3()
  const _euler = new THREE.Euler()

  useFrame(() => {
    if (!ref.current) return

    camera.getWorldDirection(_dir)

    // Directly follow camera — no offset, perfect sync
    ref.current.position.set(
      camera.position.x,
      camera.position.y - 0.44,
      camera.position.z
    )

    ref.current.rotation.y = Math.atan2(_dir.x, _dir.z)
  })

  return (
    <group ref={ref}>

      {/* ── TORSO ── */}
      {/* Main back/shoulders */}
      <RoundedBox position={[0, 0.04, 0]} args={[0.22, 0.42, 0.16]} radius={0.04} castShadow>
        <meshStandardMaterial color="#2c6420" roughness={0.85} />
      </RoundedBox>

      {/* Belly */}
      <mesh position={[0, -0.02, 0.07]} castShadow>
        <sphereGeometry args={[0.09, 14, 10]} />
        <meshStandardMaterial color="#c8b86e" roughness={0.9} />
      </mesh>

      {/* Scale ridge */}
      {[0.15, 0.08, 0.0, -0.08, -0.15].map((y, i) => (
        <mesh key={i} position={[0, y, -0.08]} castShadow>
          <coneGeometry args={[0.018 + i * 0.002, 0.055, 6]} />
          <meshStandardMaterial color="#1e4a14" roughness={0.8} />
        </mesh>
      ))}

      {/* Chest piece */}
      <RoundedBox position={[0, 0.06, 0.07]} args={[0.15, 0.24, 0.05]} radius={0.02} castShadow>
        <meshStandardMaterial color="#0a0a14" roughness={0.5} metalness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.06, 0.1]}>
        <boxGeometry args={[0.04, 0.14, 0.006]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.2} />
      </mesh>

      {/* LEFT ARM */}
      <group position={[-0.14, 0.08, 0.01]} rotation={[0.3, 0.1, 0.45]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.028, 0.024, 0.18, 10]} />
          <meshStandardMaterial color="#2c6420" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.16, 0.03]} rotation={[0.5, 0, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.018, 0.14, 10]} />
          <meshStandardMaterial color="#2c6420" roughness={0.85} />
        </mesh>
        {[-0.02, 0, 0.02].map((x, i) => (
          <mesh key={i} position={[x, -0.26, 0.06]} rotation={[0.8, 0, 0]} castShadow>
            <coneGeometry args={[0.009, 0.04, 5]} />
            <meshStandardMaterial color="#1a3a10" roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* RIGHT ARM */}
      <group position={[0.14, 0.08, 0.01]} rotation={[0.3, -0.1, -0.45]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.028, 0.024, 0.18, 10]} />
          <meshStandardMaterial color="#2c6420" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.16, 0.03]} rotation={[0.5, 0, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.018, 0.14, 10]} />
          <meshStandardMaterial color="#2c6420" roughness={0.85} />
        </mesh>
        {[-0.02, 0, 0.02].map((x, i) => (
          <mesh key={i} position={[x, -0.26, 0.06]} rotation={[0.8, 0, 0]} castShadow>
            <coneGeometry args={[0.009, 0.04, 5]} />
            <meshStandardMaterial color="#1a3a10" roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* TAIL */}
      <group position={[0, -0.1, -0.09]} rotation={[-0.3, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.055, 0.022, 0.45, 10]} />
          <meshStandardMaterial color="#2c6420" roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.3, 0.05]} rotation={[-0.5, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.008, 0.25, 8]} />
          <meshStandardMaterial color="#2c6420" roughness={0.85} />
        </mesh>
      </group>

      {/* LEGS */}
      {[-0.07, 0.07].map((x, i) => (
        <group key={i} position={[x, -0.26, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.038, 0.03, 0.24, 10]} />
            <meshStandardMaterial color="#2c6420" roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.2, 0.03]} rotation={[0.2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.028, 0.02, 0.22, 10]} />
            <meshStandardMaterial color="#264f1c" roughness={0.85} />
          </mesh>
          {[-0.018, 0, 0.018].map((fx, fi) => (
            <mesh key={fi} position={[fx, -0.35, 0.06]} rotation={[0.6, 0, 0]} castShadow>
              <coneGeometry args={[0.01, 0.045, 5]} />
              <meshStandardMaterial color="#1a3a10" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
