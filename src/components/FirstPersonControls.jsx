import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'

export default function FirstPersonControls({ onLock, onUnlock, onNearChair, onSitting, chairNudge }) {
  const { camera } = useThree()
  const controlsRef = useRef()

  const STAND_HEIGHT = 1.6
  const SIT_HEIGHT   = 0.72

  const moveSpeed      = 5
  const velocity       = useRef(new THREE.Vector3())
  const smoothVelocity = useRef(new THREE.Vector3())
  const direction      = useRef(new THREE.Vector3())
  const isSitting      = useRef(false)
  const targetHeight   = useRef(STAND_HEIGHT)
  const nearChair      = useRef(false)

  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false })

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
    // Down arrow to sit / stand
    const onKey = (e) => {
      if (e.key === 'ArrowDown' && nearChair.current) {
        isSitting.current = !isSitting.current
        targetHeight.current = isSitting.current ? SIT_HEIGHT : STAND_HEIGHT
        if (onSitting) onSitting(isSitting.current)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useFrame((state, delta) => {
    if (!controlsRef.current?.isLocked) return

    // Proximity check for chair — use dynamic position
    const chairCX = 0 + (chairNudge?.current?.x ?? 0)
    const chairCZ = -2.6 + (chairNudge?.current?.z ?? 0)
    const chairCurrentPos = new THREE.Vector3(chairCX, 0, chairCZ)
    const dist = camera.position.distanceTo(chairCurrentPos)
    const isNear = dist < 15
    if (isNear !== nearChair.current) {
      nearChair.current = isNear
      if (onNearChair) onNearChair(isNear)
    }
    // Stand up automatically if walked away
    if (!isNear && isSitting.current) {
      isSitting.current = false
      targetHeight.current = STAND_HEIGHT
      if (onSitting) onSitting(false)
    }

    // Smooth camera height transition
    camera.position.y += (targetHeight.current - camera.position.y) * 0.12

    // No walking while sitting
    if (isSitting.current) return

    // Movement
    direction.current.set(0, 0, 0)
    if (keys.current.w) direction.current.z -= 1
    if (keys.current.s) direction.current.z += 1
    if (keys.current.a) direction.current.x -= 1
    if (keys.current.d) direction.current.x += 1
    if (direction.current.length() > 0) direction.current.normalize()

    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0; forward.normalize()
    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0))

    const speed = keys.current.shift ? moveSpeed * 2 : moveSpeed
    velocity.current.set(0, 0, 0)
    velocity.current.addScaledVector(forward, -direction.current.z * speed)
    velocity.current.addScaledVector(right, direction.current.x * speed)

    const lerpFactor = direction.current.length() > 0 ? 0.18 : 0.1
    smoothVelocity.current.lerp(velocity.current, lerpFactor)
    camera.position.addScaledVector(smoothVelocity.current, delta)

    camera.position.x = Math.max(-4.5, Math.min(4.5, camera.position.x))
    camera.position.z = Math.max(-4.5, Math.min(4.5, camera.position.z))

    // AABB collision resolution
    // Returns the push vector if colliding, null otherwise
    const resolveBox = (px, pz, cx, cz, hw, hd) => {
      const r = 0.32
      const dx = px - cx, dz = pz - cz
      if (Math.abs(dx) < hw + r && Math.abs(dz) < hd + r) {
        const ox = (hw + r) - Math.abs(dx)
        const oz = (hd + r) - Math.abs(dz)
        if (ox < oz) { camera.position.x += ox * Math.sign(dx); return { x: Math.sign(dx), z: 0 } }
        else          { camera.position.z += oz * Math.sign(dz); return { x: 0, z: Math.sign(dz) } }
      }
      return null
    }

    // Desk at [0, 0, -3.8] — half extents 1.25 × 0.45
    resolveBox(camera.position.x, camera.position.z, 0, -3.8, 1.25, 0.45)

    // Chair collision — follow dynamic position
    const chairHit = resolveBox(camera.position.x, camera.position.z, chairCX, chairCZ, 0.38, 0.38)
    if (chairHit && chairNudge) {
      chairNudge.current.x -= chairHit.x * 0.025
      chairNudge.current.z -= chairHit.z * 0.025
    }
  })

  return (
    <PointerLockControls
      ref={controlsRef}
      onLock={onLock}
      onUnlock={onUnlock}
    />
  )
}
