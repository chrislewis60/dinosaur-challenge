import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'

export default function FirstPersonControls({ onLock, onUnlock }) {
  const { camera } = useThree()
  const controlsRef = useRef()
  
  const moveSpeed = 5
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase()
      if (key === 'w') keys.current.w = true
      if (key === 'a') keys.current.a = true
      if (key === 's') keys.current.s = true
      if (key === 'd') keys.current.d = true
      if (key === 'shift') keys.current.shift = true
    }

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase()
      if (key === 'w') keys.current.w = false
      if (key === 'a') keys.current.a = false
      if (key === 's') keys.current.s = false
      if (key === 'd') keys.current.d = false
      if (key === 'shift') keys.current.shift = false
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  useFrame((state, delta) => {
    if (!controlsRef.current?.isLocked) return

    // Get movement direction
    direction.current.set(0, 0, 0)

    if (keys.current.w) direction.current.z -= 1
    if (keys.current.s) direction.current.z += 1
    if (keys.current.a) direction.current.x -= 1
    if (keys.current.d) direction.current.x += 1

    // Normalize diagonal movement
    if (direction.current.length() > 0) {
      direction.current.normalize()
    }

    // Calculate velocity based on camera direction
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()

    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0))

    // Apply movement
    const speed = keys.current.shift ? moveSpeed * 2 : moveSpeed
    velocity.current.set(0, 0, 0)
    velocity.current.addScaledVector(forward, -direction.current.z * speed * delta)
    velocity.current.addScaledVector(right, direction.current.x * speed * delta)

    camera.position.add(velocity.current)

    // Keep camera at eye level
    camera.position.y = 1.6
    
    // Boundary constraints (keep player in room)
    camera.position.x = Math.max(-4.5, Math.min(4.5, camera.position.x))
    camera.position.z = Math.max(-4.5, Math.min(4.5, camera.position.z))
  })

  return (
    <PointerLockControls
      ref={controlsRef}
      onLock={onLock}
      onUnlock={onUnlock}
    />
  )
}
