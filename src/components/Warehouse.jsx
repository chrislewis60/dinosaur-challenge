import { useMemo } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
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
// Gives a stable 0-1 value from any numeric seed
const sr = (seed) => {
  const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return v - Math.floor(v)
}

// ── Crate ─────────────────────────────────────────────────────────────────────

function Crate({ position, rotation = [0, 0, 0], w=1.1, h=1.1, d=1.1, color='#7a5c18', open=false }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
      {/* Slightly ajar lid */}
      {open && (
        <mesh position={[0, h / 2 + 0.02, -d * 0.22]} rotation={[0.38, 0, 0]} castShadow>
          <boxGeometry args={[w, 0.045, d * 0.52]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      )}
    </group>
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

// ── Warehouse ─────────────────────────────────────────────────────────────────

const W         = 30    // half-width  → 60 total
const D         = 24    // half-depth  → 48 total
const H         = 9     // ceiling height
const ROW_X     = [-22, -11, 0, 11, 22]
const SHELF_Z   = -6    // centre of shelf row
const SHELF_LEN = 30    // z = -21 to z = 9  (front z=10+ stays free)

export default function Warehouse() {
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
        <mesh position={[0, H/2, -D]} receiveShadow>
          <boxGeometry args={[W*2, H, 0.2]} />
          <meshStandardMaterial map={wallTex} roughness={0.9} />
        </mesh>
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

      {/* Shelf colliders */}
      <RigidBody type="fixed">
        {ROW_X.map(x => (
          <CuboidCollider key={x} args={[0.28, 2.3, SHELF_LEN/2]} position={[x, 2.3, SHELF_Z]} />
        ))}
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

      {/* Floor crates at back end of each row */}
      {ROW_X.flatMap(x =>
        [-21, -19].map(z => (
          <group key={`${x}-${z}`}>
            <Crate position={[x-0.6, 0.55, z]} />
            <Crate position={[x+0.6, 0.55, z]} />
            <Crate position={[x,     1.65, z]} />
          </group>
        ))
      )}

      {/* Crate stacks along back wall */}
      {[-24,-18,-12,-6,0,6,12,18,24].map(x => (
        <group key={`bw-${x}`}>
          <Crate position={[x, 0.55, -22]} />
          <Crate position={[x, 1.65, -22]} />
          <Crate position={[x, 2.75, -22]} />
        </group>
      ))}

      {/* Crates along side walls */}
      {[-18,-10,-2,6,14].map(z => (
        <group key={`walls-${z}`}>
          <Crate position={[-29, 0.55, z]} /><Crate position={[-29, 1.65, z]} />
          <Crate position={[ 29, 0.55, z]} /><Crate position={[ 29, 1.65, z]} />
        </group>
      ))}

      {/* Barrels in corner aisles */}
      {[-16,-5,6].flatMap(z =>
        [-26,26].map(x => (
          <group key={`bar-${x}-${z}`}>
            <Barrel position={[x, 0.42, z]} />
            <Barrel position={[x, 1.27, z]} />
          </group>
        ))
      )}

      {/* Loading dock (free front area) */}
      <mesh position={[0, 0.18, 20]} receiveShadow>
        <boxGeometry args={[14, 0.36, 6]} />
        <meshStandardMaterial color="#3a3835" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.37, 17.05]}>
        <boxGeometry args={[14, 0.04, 0.15]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}
