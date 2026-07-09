import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'

function ArcadeMachine({ position, rotation = [0, 0, 0], color = '#ff0088' }) {
  const lightRef = useRef()
  const screenRef = useRef()
  
  useFrame((state) => {
    // Pulsing light effect
    if (lightRef.current) {
      lightRef.current.intensity = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.3
    }
    // Flickering screen
    if (screenRef.current) {
      screenRef.current.emissiveIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 5) * 0.2
    }
  })
  
  return (
    <group position={position} rotation={rotation}>
      {/* Cabinet body */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[0.7, 1.5, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      
      {/* Screen - animated */}
      <mesh position={[0, 1.2, 0.26]} castShadow>
        <boxGeometry args={[0.5, 0.4, 0.02]} />
        <meshStandardMaterial ref={screenRef} color="#000" emissive="#0088ff" emissiveIntensity={0.8} roughness={0.2} />
      </mesh>
      
      {/* Control panel */}
      <mesh position={[0, 0.6, 0.3]} rotation={[-0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.6, 0.25, 0.12]} />
        <meshStandardMaterial color="#222" roughness={0.5} />
      </mesh>
      
      {/* Marquee glow */}
      <mesh position={[0, 1.5, 0.25]}>
        <boxGeometry args={[0.6, 0.12, 0.04]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
      </mesh>
      
      {/* Pulsing light from arcade machine */}
      <pointLight ref={lightRef} position={[0, 1.2, 0.5]} color={color} intensity={0.8} distance={2.5} />
    </group>
  )
}

function BeanBag({ position, color = '#8B4513', playerPosition }) {
  const groupRef = useRef()
  const [offset, setOffset] = useState({ x: 0, z: 0 })
  const [squish, setSquish] = useState(1)
  
  useFrame(() => {
    if (!groupRef.current || !playerPosition) return
    
    const beanBagPos = new THREE.Vector3(position[0], position[1], position[2])
    const distance = playerPosition.distanceTo(beanBagPos)
    
    // React when player gets close
    if (distance < 1.2) {
      const pushStrength = (1.2 - distance) * 0.3
      const direction = new THREE.Vector3()
        .subVectors(beanBagPos, playerPosition)
        .normalize()
      
      setOffset({
        x: direction.x * pushStrength,
        z: direction.z * pushStrength
      })
      setSquish(1 - (1.2 - distance) * 0.1)
    } else {
      // Spring back slowly
      setOffset({
        x: offset.x * 0.95,
        z: offset.z * 0.95
      })
      setSquish(squish + (1 - squish) * 0.1)
    }
    
    groupRef.current.position.x = position[0] + offset.x
    groupRef.current.position.z = position[2] + offset.z
    groupRef.current.scale.set(1, squish, 1)
  })
  
  return (
    <group ref={groupRef} position={position}>
      {/* Main bean bag body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <sphereGeometry args={[0.5, 16, 12]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Flatten bottom */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.5, 0.1, 16]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  )
}

function Controller({ position, rotation = [0, 0, 0], color = '#2a2a2a' }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Controller body */}
      <mesh castShadow>
        <boxGeometry args={[0.12, 0.06, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* Buttons */}
      <mesh position={[0.03, 0.035, 0]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.05, 0.035, 0]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

function LowTable({ position }) {
  return (
    <group position={position}>
      {/* Table top */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.2, 0.05, 0.6]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Legs */}
      {[-0.5, 0.5].map((x) =>
        [-0.25, 0.25].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.15, z]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        ))
      )}
    </group>
  )
}

function DrinkCan({ position, color = '#ff0000' }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.03, 0.03, 0.1, 16]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
    </mesh>
  )
}

function SnackBag({ position, rotation = [0, 0, 0] }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <boxGeometry args={[0.08, 0.12, 0.04]} />
      <meshStandardMaterial color="#FFA500" roughness={0.6} />
    </mesh>
  )
}

function WallPoster({ position, rotation = [0, 0, 0], color = '#ff00ff' }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[0.6, 0.8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
    </group>
  )
}

function Cable({ start, end, color = '#333' }) {
  const points = []
  const segments = 10
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const x = start[0] + (end[0] - start[0]) * t
    const y = start[1] + (end[1] - start[1]) * t - Math.sin(t * Math.PI) * 0.2
    const z = start[2] + (end[2] - start[2]) * t
    points.push(new THREE.Vector3(x, y, z))
  }
  
  const curve = new THREE.CatmullRomCurve3(points)
  
  return (
    <mesh>
      <tubeGeometry args={[curve, 20, 0.01, 8, false]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function NeonSign({ position, text = "ARCADE", color = "#ff00ff" }) {
  const lightRef = useRef()
  
  useFrame((state) => {
    // Flickering neon effect
    if (lightRef.current) {
      const flicker = Math.random() > 0.95 ? 0.5 : 1
      lightRef.current.intensity = 2 * flicker
    }
  })
  
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[3, 0.5, 0.1]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={1}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0, 0.5]} color={color} intensity={2} distance={5} />
    </group>
  )
}

// Floating dust particles
function DustParticles() {
  const particlesRef = useRef()
  const count = 50
  const positions = useRef(new Float32Array(count * 3))
  
  // Initialize random positions
  for (let i = 0; i < count; i++) {
    positions.current[i * 3] = (Math.random() - 0.5) * 10
    positions.current[i * 3 + 1] = Math.random() * 3
    positions.current[i * 3 + 2] = (Math.random() - 0.5) * 10
  }
  
  useFrame((state) => {
    if (!particlesRef.current) return
    
    const positions = particlesRef.current.attributes.position.array
    for (let i = 0; i < count; i++) {
      // Slow floating motion
      positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.0005
      
      // Reset if too high
      if (positions[i * 3 + 1] > 3) {
        positions[i * 3 + 1] = 0
      }
    }
    particlesRef.current.attributes.position.needsUpdate = true
  })
  
  return (
    <points>
      <bufferGeometry ref={particlesRef}>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#ffffff" transparent opacity={0.3} />
    </points>
  )
}

// Pulsing glow cube
function GlowCube({ position, color = '#ff0088' }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.4
      meshRef.current.rotation.y += 0.01
    }
  })
  
  return (
    <mesh ref={meshRef} position={position} castShadow>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  )
}

export default function ArcadeRoom() {
  const wallTexture = useTexture('/chrislewis60_a_dino_playing_a_futureistic_game_--v_8.1_5a6897a9-48a8-4f99-896d-d781db395241_2.png')
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping
  wallTexture.repeat.set(1.5, 1)
  
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 1.6, 3))
  
  // Track player position from camera
  useFrame((state) => {
    setPlayerPosition(state.camera.position.clone())
  })

  return (
    <group>
      {/* Floating dust particles */}
      <DustParticles />
      
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 1.5, -5]} receiveShadow>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshStandardMaterial color="#16213e" />
      </mesh>
      
      {/* Poster/artwork on back wall */}
      <mesh position={[0, 1.5, -4.95]}>
        <planeGeometry args={[2.5, 1.5]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshStandardMaterial color="#16213e" />
      </mesh>

      {/* Right wall */}
      <mesh position={[5, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshStandardMaterial color="#16213e" />
      </mesh>

      {/* Arcade Machines - back wall */}
      <ArcadeMachine position={[-2.2, 0, -4.3]} color="#ff0088" />
      <ArcadeMachine position={[0, 0, -4.3]} color="#00ffff" />
      <ArcadeMachine position={[2.2, 0, -4.3]} color="#ffff00" />
      
      {/* Side arcade machines */}
      <ArcadeMachine position={[-4.3, 0, -1.5]} rotation={[0, Math.PI / 2, 0]} color="#ff00ff" />
      <ArcadeMachine position={[4.3, 0, -1.5]} rotation={[0, -Math.PI / 2, 0]} color="#00ff88" />

      {/* Bean bags - interactive! */}
      <BeanBag position={[-1.5, 0, 0.5]} color="#8B4513" playerPosition={playerPosition} />
      <BeanBag position={[1.5, 0, 0.5]} color="#654321" playerPosition={playerPosition} />
      <BeanBag position={[0, 0, 1.5]} color="#A0522D" playerPosition={playerPosition} />
      <BeanBag position={[-3, 0, 1]} color="#6B4423" playerPosition={playerPosition} />
      <BeanBag position={[3, 0, 1]} color="#8B6914" playerPosition={playerPosition} />

      {/* Low table with controllers */}
      <LowTable position={[0, 0, 0]} />
      <Controller position={[-0.2, 0.35, 0]} rotation={[0, 0.3, 0]} color="#2a2a2a" />
      <Controller position={[0.2, 0.35, 0.1]} rotation={[0, -0.2, 0]} color="#1a1a2a" />
      <Controller position={[0, 0.35, -0.15]} rotation={[0, 0.5, 0]} color="#2a1a1a" />

      {/* Controllers near gaming stations */}
      <Controller position={[-2.2, 0.85, -3.9]} rotation={[0, 0, 0]} color="#ff0088" />
      <Controller position={[0, 0.85, -3.9]} rotation={[0, 0.1, 0]} color="#00ffff" />
      <Controller position={[2.2, 0.85, -3.9]} rotation={[0, -0.1, 0]} color="#ffff00" />

      {/* Drink cans on table */}
      <DrinkCan position={[-0.4, 0.4, 0.2]} color="#ff0000" />
      <DrinkCan position={[0.35, 0.4, -0.2]} color="#0066ff" />
      <DrinkCan position={[-0.1, 0.4, 0.25]} color="#00ff00" />
      
      {/* Snack bags on table */}
      <SnackBag position={[0.45, 0.37, 0.15]} rotation={[0, 0.5, 0]} />
      <SnackBag position={[-0.3, 0.37, -0.1]} rotation={[0, -0.3, 0]} />
      
      {/* Wall posters */}
      <WallPoster position={[-3, 2, -4.98]} color="#ff0088" />
      <WallPoster position={[3, 2, -4.98]} color="#00ffff" />
      <WallPoster position={[-4.98, 2, -3]} rotation={[0, Math.PI / 2, 0]} color="#ffff00" />
      <WallPoster position={[4.98, 2, -3]} rotation={[0, -Math.PI / 2, 0]} color="#00ff88" />
      
      {/* Cables from arcade machines to floor */}
      <Cable start={[-2.2, 0.5, -4.2]} end={[-2.2, 0.05, -4.5]} />
      <Cable start={[0, 0.5, -4.2]} end={[0, 0.05, -4.5]} />
      <Cable start={[2.2, 0.5, -4.2]} end={[2.2, 0.05, -4.5]} />

      {/* Neon Signs - flickering */}
      <NeonSign position={[0, 2.7, -4.9]} text="ARCADE" color="#ff00ff" />
      
      {/* Storage crates in corners */}
      <mesh position={[-4, 0.3, 3.5]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>
      <mesh position={[4, 0.3, 3.5]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>
      
      {/* Pulsing glowing cubes */}
      <GlowCube position={[-4, 0.65, 3.5]} color="#ff0088" />
      <GlowCube position={[4, 0.65, 3.5]} color="#00ffff" />
      <GlowCube position={[0, 0.4, -4.5]} color="#ffff00" />
    </group>
  )
}
