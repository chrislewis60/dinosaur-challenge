import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { useSoundManager } from './useSound'

export default function FirstPersonControls({ onLock, onUnlock, onNearChair, onSitting, chairBodyRef, roomBounds = 4.5, furnitureCollision = true, staticColliders = [], platforms = [] }) {
  const { camera } = useThree()
  const controlsRef = useRef()
  const { play: playSound } = useSoundManager()
  const footstepTimer = useRef(0)

  const STAND_HEIGHT = 1.6
  const SIT_HEIGHT   = 0.72
  const SIT_RADIUS   = 1.8

  const moveSpeed      = 5
  const keys           = useRef({ w: false, a: false, s: false, d: false, shift: false })
  const velocity       = useRef(new THREE.Vector3())
  const smoothVelocity = useRef(new THREE.Vector3())
  const direction      = useRef(new THREE.Vector3())
  const isSitting      = useRef(false)
  const targetHeight   = useRef(STAND_HEIGHT)
  const nearChair      = useRef(false)
  const sittingFrames  = useRef(0)
  const jumpVelocity   = useRef(0)
  const isJumping      = useRef(false)

  const GRAVITY    = -18
  const JUMP_FORCE =  7

  const _chairPos      = new THREE.Vector3()
  const _monitorCenter = new THREE.Vector3()
  const _lookMat       = new THREE.Matrix4()
  const _targetQuat    = new THREE.Quaternion()

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase()
      if (key === 'w') keys.current.w = true
      if (key === 'a') keys.current.a = true
      if (key === 's') keys.current.s = true
      if (key === 'd') keys.current.d = true
      if (key === 'shift') keys.current.shift = true
      // ↓ = sit/stand when within radius of chair (works whether locked or not)
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (nearChair.current) {
          isSitting.current = !isSitting.current
          targetHeight.current = isSitting.current ? SIT_HEIGHT : STAND_HEIGHT
          if (onSitting) onSitting(isSitting.current)
        }
      }
      if (e.code === 'Space') {
        e.preventDefault()
        if (!isSitting.current && !isJumping.current) {
          jumpVelocity.current = JUMP_FORCE
          isJumping.current    = true
        }
      }
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

    // Dynamic floor height — highest platform the player is currently standing on
    const getFloorY = () => {
      const px = camera.position.x, pz = camera.position.z
      let best = 0
      for (const p of platforms) {
        if (p.surfaceY < camera.position.y - STAND_HEIGHT + 0.35 &&
            Math.abs(px - p.cx) < p.hw + 0.18 &&
            Math.abs(pz - p.cz) < p.hd + 0.18) {
          if (p.surfaceY > best) best = p.surfaceY
        }
      }
      return best
    }
    const standY = getFloorY() + STAND_HEIGHT

    // Height lerp — only when standing and not mid-jump
    if (!isSitting.current && !isJumping.current) {
      camera.position.y += (standY - camera.position.y) * 0.12
    }

    // Jump physics
    if (isJumping.current) {
      jumpVelocity.current  += GRAVITY * delta
      camera.position.y     += jumpVelocity.current * delta
      const landY = getFloorY() + STAND_HEIGHT
      if (jumpVelocity.current < 0 && camera.position.y <= landY) {
        camera.position.y    = landY
        jumpVelocity.current = 0
        isJumping.current    = false
      }
    }

    // Proximity check — read actual rigid body position if available
    const chairTrans = chairBodyRef?.current?.translation()
    const chairCX = chairTrans?.x ?? 0
    const chairCZ = chairTrans?.z ?? -2.6
    _chairPos.set(chairCX, camera.position.y, chairCZ)
    const dist = camera.position.distanceTo(_chairPos)
    const isNear = dist < SIT_RADIUS
    if (isNear !== nearChair.current) {
      nearChair.current = isNear
      if (onNearChair) onNearChair(isNear)
    }
    // Auto-stand if walked away while sitting
    if (!isNear && isSitting.current) {
      isSitting.current = false
      targetHeight.current = STAND_HEIGHT
      if (onSitting) onSitting(false)
    }

    // Zoom camera in toward all three monitors while sitting
    if (isSitting.current) {
      sittingFrames.current++
      const ct = chairBodyRef?.current?.translation()
      const baseX = ct?.x ?? 0
      // Glide to a spot where all three screens fill the view comfortably
      camera.position.x += (baseX       - camera.position.x) * 0.06
      camera.position.y += (1.25        - camera.position.y) * 0.06
      camera.position.z += (-3.05       - camera.position.z) * 0.06
      // For the first ~2 s, smoothly steer toward the centre screen
      if (sittingFrames.current < 120) {
        _monitorCenter.set(baseX, 1.25, -4.05)
        _lookMat.lookAt(camera.position, _monitorCenter, new THREE.Vector3(0, 1, 0))
        camera.quaternion.slerp(_targetQuat.setFromRotationMatrix(_lookMat), 0.06)
      }
      return
    }
    sittingFrames.current = 0

    // Movement
    direction.current.set(0, 0, 0)
    if (keys.current.w) direction.current.z -= 1
    if (keys.current.s) direction.current.z += 1
    if (keys.current.a) direction.current.x -= 1
    if (keys.current.d) direction.current.x += 1
    
    const isMoving = direction.current.length() > 0
    if (isMoving) {
      direction.current.normalize()
      // Play footstep sound every 0.45 seconds while moving
      footstepTimer.current += delta
      if (footstepTimer.current >= 0.45) {
        playSound('/sounds/footstep.mp3', 0.3)
        footstepTimer.current = 0
      }
    } else {
      footstepTimer.current = 0
    }

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

    camera.position.x = Math.max(-roomBounds, Math.min(roomBounds, camera.position.x))
    camera.position.z = Math.max(-roomBounds, Math.min(roomBounds, camera.position.z))

    // AABB collision resolution
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

    if (furnitureCollision) {
      // Desk collision
      resolveBox(camera.position.x, camera.position.z, 0, -3.8, 1.25, 0.45)

      // Chair collision — gentle push via physics impulse
      const chairHit = resolveBox(camera.position.x, camera.position.z, chairCX, chairCZ, 0.38, 0.38)
      if (chairHit && chairBodyRef?.current) {
        chairBodyRef.current.applyImpulse(
          { x: -chairHit.x * 1.2, y: 0, z: -chairHit.z * 1.2 },
          true
        )
      }
    }

    // World-space static colliders (shelves, crates, etc.)
    staticColliders.forEach(({ cx, cz, hw, hd }) => {
      resolveBox(camera.position.x, camera.position.z, cx, cz, hw, hd)
    })
  })

  return (
    <PointerLockControls
      ref={controlsRef}
      onLock={onLock}
      onUnlock={onUnlock}
    />
  )
}
