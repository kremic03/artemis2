import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, TextureLoader } from 'three'
import { MOON_RADIUS, MOON_POS } from '@shared/constants/trajectory'
import { PROCEDURAL_TEXTURE_SIZES } from '@shared/constants/scene'

// ─── Procedural Moon texture ──────────────────────────────────────────────────
function createMoonTexture() {
  const { width: W, height: H } = PROCEDURAL_TEXTURE_SIZES.moon
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // Highlands base — light gray
  const base = ctx.createLinearGradient(0, 0, W, H)
  base.addColorStop(0.0, '#a0a0a0')
  base.addColorStop(0.5, '#b8b8b8')
  base.addColorStop(1.0, '#989898')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, W, H)

  // Always returns a value in [0, 1)
  const seed = (n) => Math.abs((Math.sin(n * 9301 + 49297) * 233280) % 1)

  // ── Mare (dark basaltic plains) ──
  const maria = [
    { cx: 0.33, cy: 0.38, rx: 0.12, ry: 0.10, color: '#666677' }, // Mare Imbrium
    { cx: 0.44, cy: 0.44, rx: 0.08, ry: 0.07, color: '#6a6a7a' }, // Mare Serenitatis
    { cx: 0.47, cy: 0.52, rx: 0.09, ry: 0.08, color: '#707080' }, // Mare Tranquillitatis
    { cx: 0.54, cy: 0.50, rx: 0.06, ry: 0.05, color: '#6e6e7e' }, // Mare Fecunditatis
    { cx: 0.28, cy: 0.48, rx: 0.10, ry: 0.08, color: '#686878' }, // Oceanus Procellarum
    { cx: 0.40, cy: 0.34, rx: 0.06, ry: 0.05, color: '#6c6c7c' }, // Mare Frigoris (partial)
    { cx: 0.58, cy: 0.42, rx: 0.04, ry: 0.04, color: '#707082' }, // Mare Crisium
  ]

  maria.forEach(({ cx, cy, rx, ry, color }) => {
    const x = cx * W
    const y = cy * H
    const rW = Math.max(1, rx * W)
    const rH = Math.max(1, ry * H)

    // Use ellipse() — no scale trick needed, no division-by-zero risk
    const grad = ctx.createRadialGradient(x, y, 0, x, y, rW)
    grad.addColorStop(0,   color)
    grad.addColorStop(0.7, color)
    grad.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(x, y, rW, rH, 0, 0, Math.PI * 2)
    ctx.fill()
  })

  // ── Craters ──
  for (let i = 0; i < 200; i++) {
    const cx   = seed(i * 5)     * W
    const cy   = seed(i * 5 + 1) * H
    const r    = Math.max(1, 2 + seed(i * 5 + 2) * (i < 20 ? 30 : 10))
    const dark = 0.65 + seed(i * 7) * 0.15

    // Rim highlight
    ctx.strokeStyle = `rgba(200,200,200,0.5)`
    ctx.lineWidth = Math.max(1, r * 0.15)
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()

    // Floor shadow
    ctx.fillStyle = `rgba(0,0,0,${0.15 + seed(i * 11) * 0.2})`
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2)
    ctx.fill()
  }

  // Terrain grain
  ctx.globalAlpha = 0.04
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000'
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
  }
  ctx.globalAlpha = 1

  return new CanvasTexture(canvas)
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Moon() {
  const meshRef = useRef()
  const proceduralTex = useMemo(() => createMoonTexture(), [])
  const [texture, setTexture] = useState(proceduralTex)

  useEffect(() => {
    new TextureLoader().load('/textures/moon.jpg', t => setTexture(t))
  }, [])

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += 0.002 * delta
  })

  return (
    <group position={MOON_POS}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[MOON_RADIUS, 56, 56]} />
        <meshPhongMaterial
          map={texture}
          shininess={3}
          specular="#111111"
        />
      </mesh>

      {/* Inner soft edge glow */}
      <mesh>
        <sphereGeometry args={[MOON_RADIUS + 0.08, 32, 32]} />
        <meshBasicMaterial
          color="#aaaaaa"
          transparent
          opacity={0.04}
          depthWrite={false}
        />
      </mesh>

      {/* Outer diffuse glow — lunar halo */}
      <mesh>
        <sphereGeometry args={[MOON_RADIUS + 0.35, 24, 24]} />
        <meshBasicMaterial
          color="#666688"
          transparent
          opacity={0.015}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
