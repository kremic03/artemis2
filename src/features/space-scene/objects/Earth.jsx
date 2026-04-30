import { useMemo, useEffect, useState } from 'react'
import { CanvasTexture, TextureLoader, FrontSide, Quaternion, Vector3 } from 'three'
import { EARTH_RADIUS, KSC_NORMAL } from '@shared/constants/trajectory'
import { PROCEDURAL_TEXTURE_SIZES } from '@shared/constants/scene'

const HEMISPHERE_ARGS = [EARTH_RADIUS, 128, 64, 0, Math.PI * 2, 0, Math.PI / 2]
const CLOUD_HEMISPHERE_ARGS = [EARTH_RADIUS + 0.045, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2]
const LOCAL_UP = new Vector3(0, 1, 0)

// ─── Procedural Earth diffuse texture ────────────────────────────────────────
function createEarthDiffuse() {
  const { width: W, height: H } = PROCEDURAL_TEXTURE_SIZES.earthDiffuse
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // Deeper, more saturated ocean gradient (poles → equator → poles)
  const ocean = ctx.createLinearGradient(0, 0, 0, H)
  ocean.addColorStop(0.0,  '#071a38')
  ocean.addColorStop(0.14, '#0b2a56')
  ocean.addColorStop(0.32, '#124a96')
  ocean.addColorStop(0.50, '#1968cc')
  ocean.addColorStop(0.68, '#124a96')
  ocean.addColorStop(0.86, '#0b2a56')
  ocean.addColorStop(1.0,  '#071a38')
  ctx.fillStyle = ocean
  ctx.fillRect(0, 0, W, H)

  // Land color palettes
  const C_VEGETATION = '#2d5a23'
  const C_FOREST     = '#20471c'
  const C_STEPPE     = '#6a7a3a'
  const C_DESERT     = '#c9a35e'
  const C_TUNDRA     = '#8a9a8a'

  const land = (color = C_VEGETATION, alpha = 1) => {
    ctx.fillStyle = typeof color === 'string' ? color : `rgba(45,90,35,${alpha})`
    ctx.globalAlpha = alpha
  }

  const poly = (pts) => {
    ctx.beginPath()
    ctx.moveTo(pts[0][0] * W, pts[0][1] * H)
    pts.slice(1).forEach(([x, y]) => ctx.lineTo(x * W, y * H))
    ctx.closePath()
    ctx.fill()
  }

  // ── North America (forested continent body) ──
  land(C_VEGETATION)
  poly([
    [0.07,0.10],[0.10,0.08],[0.16,0.07],[0.22,0.08],[0.27,0.12],
    [0.30,0.18],[0.31,0.28],[0.29,0.38],[0.26,0.46],[0.21,0.52],
    [0.17,0.55],[0.13,0.52],[0.10,0.46],[0.07,0.38],[0.05,0.26],
  ])
  // NA boreal / tundra strip (northern Canada, Alaska)
  land(C_TUNDRA, 0.9)
  poly([[0.07,0.10],[0.22,0.08],[0.26,0.12],[0.24,0.18],[0.12,0.18],[0.06,0.16]])
  // NA desert strip (SW US / N Mexico)
  land(C_DESERT, 0.75)
  poly([[0.17,0.42],[0.22,0.42],[0.24,0.50],[0.20,0.54],[0.16,0.50]])
  // Central America / Mexico
  land(C_VEGETATION, 0.9)
  poly([[0.21,0.52],[0.23,0.50],[0.26,0.52],[0.24,0.60],[0.20,0.62],[0.18,0.58]])

  // ── Greenland (ice) ──
  land('#dbe8ee', 0.95)
  poly([[0.10,0.05],[0.16,0.03],[0.22,0.04],[0.23,0.10],[0.18,0.12],[0.11,0.10]])

  // ── South America ──
  land(C_FOREST)   // Amazon
  poly([
    [0.19,0.54],[0.23,0.52],[0.27,0.55],[0.29,0.62],[0.28,0.74],
    [0.25,0.84],[0.20,0.90],[0.16,0.88],[0.13,0.80],[0.14,0.68],
    [0.16,0.58],
  ])
  // Patagonian steppe
  land(C_STEPPE, 0.8)
  poly([[0.18,0.82],[0.22,0.82],[0.22,0.90],[0.16,0.90]])
  // Atacama / Andes (desert strip on west)
  land(C_DESERT, 0.5)
  poly([[0.17,0.64],[0.19,0.64],[0.20,0.82],[0.17,0.82]])

  // ── Europe ──
  land(C_VEGETATION)
  poly([
    [0.47,0.12],[0.52,0.08],[0.58,0.10],[0.60,0.16],[0.58,0.24],
    [0.54,0.28],[0.50,0.30],[0.47,0.26],[0.46,0.18],
  ])
  // Scandinavian Peninsula
  land(C_FOREST, 0.9)
  poly([[0.52,0.08],[0.55,0.04],[0.59,0.06],[0.58,0.12],[0.54,0.14],[0.52,0.10]])

  // ── Africa ──
  land(C_VEGETATION)
  poly([
    [0.46,0.26],[0.50,0.24],[0.56,0.26],[0.60,0.30],[0.62,0.40],
    [0.61,0.52],[0.58,0.64],[0.54,0.74],[0.50,0.82],[0.46,0.80],
    [0.44,0.70],[0.43,0.58],[0.44,0.44],[0.44,0.34],
  ])
  // Sahara desert (northern band)
  land(C_DESERT, 0.92)
  poly([[0.45,0.30],[0.59,0.30],[0.62,0.40],[0.46,0.42]])
  // Congo basin (deep forest)
  land(C_FOREST, 0.95)
  poly([[0.50,0.48],[0.58,0.48],[0.58,0.60],[0.50,0.62]])
  // Kalahari / Namib
  land(C_DESERT, 0.7)
  poly([[0.50,0.68],[0.55,0.68],[0.55,0.78],[0.49,0.78]])
  // Madagascar
  land(C_VEGETATION, 0.9)
  poly([[0.62,0.60],[0.64,0.58],[0.65,0.66],[0.63,0.70],[0.61,0.67]])

  // ── Middle East / Arabia (desert) ──
  land(C_DESERT, 0.95)
  poly([
    [0.58,0.24],[0.62,0.22],[0.67,0.26],[0.68,0.34],[0.64,0.40],
    [0.60,0.40],[0.57,0.36],[0.56,0.28],
  ])

  // ── Asia (main body) ──
  land(C_VEGETATION)
  poly([
    [0.56,0.08],[0.62,0.04],[0.72,0.05],[0.82,0.08],[0.90,0.12],
    [0.96,0.16],[0.98,0.24],[0.96,0.32],[0.90,0.38],[0.82,0.42],
    [0.74,0.44],[0.66,0.44],[0.60,0.40],[0.58,0.34],[0.56,0.24],[0.56,0.14],
  ])
  // Siberian taiga (northern band)
  land(C_TUNDRA, 0.85)
  poly([[0.56,0.06],[0.92,0.07],[0.96,0.16],[0.80,0.18],[0.58,0.16]])
  // Central Asian / Gobi / Taklamakan deserts
  land(C_DESERT, 0.75)
  poly([[0.66,0.22],[0.82,0.22],[0.84,0.32],[0.68,0.32]])
  // Indian subcontinent
  land(C_VEGETATION, 0.95)
  poly([
    [0.64,0.34],[0.68,0.36],[0.70,0.42],[0.70,0.52],[0.67,0.58],
    [0.63,0.60],[0.61,0.56],[0.61,0.46],[0.62,0.38],
  ])
  // Southeast Asia (mainland)
  land(C_FOREST, 0.95)
  poly([
    [0.76,0.38],[0.80,0.36],[0.83,0.42],[0.82,0.52],[0.78,0.56],
    [0.75,0.52],[0.74,0.44],
  ])

  // ── Japan ──
  land(C_VEGETATION, 0.85)
  poly([[0.88,0.18],[0.91,0.16],[0.92,0.22],[0.90,0.26],[0.87,0.24]])

  // ── Australia ──
  land(C_DESERT, 0.92)
  poly([
    [0.77,0.58],[0.83,0.56],[0.88,0.58],[0.90,0.64],[0.88,0.72],
    [0.84,0.76],[0.78,0.76],[0.74,0.72],[0.74,0.64],
  ])
  // Australian east coast vegetation strip
  land(C_VEGETATION, 0.7)
  poly([[0.87,0.58],[0.90,0.60],[0.88,0.72],[0.85,0.72]])
  // New Zealand (tiny)
  land(C_VEGETATION, 0.85)
  poly([[0.93,0.70],[0.95,0.68],[0.96,0.74],[0.94,0.76]])

  ctx.globalAlpha = 1

  // ── Antarctica — icy white with soft upper edge ──
  const antarc = ctx.createLinearGradient(0, 0.86 * H, 0, H)
  antarc.addColorStop(0.0, 'rgba(220,235,244,0.0)')
  antarc.addColorStop(0.3, 'rgba(232,244,250,0.85)')
  antarc.addColorStop(1.0, '#f0f8fb')
  ctx.fillStyle = antarc
  ctx.fillRect(0, 0.86 * H, W, 0.14 * H)

  // ── Arctic ice cap ──
  const arctic = ctx.createLinearGradient(0, 0, 0, 0.07 * H)
  arctic.addColorStop(0.0, '#e4eff6')
  arctic.addColorStop(1.0, 'rgba(228,239,246,0)')
  ctx.fillStyle = arctic
  ctx.fillRect(0, 0, W, 0.07 * H)

  // Add subtle terrain variation noise
  ctx.globalAlpha = 0.05
  for (let i = 0; i < 3500; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const r = 2 + Math.random() * 7
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // ── Ocean shallow water color near coasts (subtle) ──
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = 0.04
  ctx.fillStyle = '#aaddff'
  ctx.fillRect(0, 0, W, H)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1

  return new CanvasTexture(canvas)
}

// ─── Procedural specular (ocean-only) map ────────────────────────────────────
// Gives oceans a bright specular response while continents stay matte — the
// key ingredient that sells the "3D sphere" look under directional light.
function createEarthSpecular() {
  const { width: W, height: H } = PROCEDURAL_TEXTURE_SIZES.earthDiffuse
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  // Everything ocean by default — bright, highly reflective
  ctx.fillStyle = '#c8d8ff'
  ctx.fillRect(0, 0, W, H)
  // Poles darker (ice doesn't have that wet-sheen)
  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0.0, 'rgba(0,0,0,0.85)')
  g.addColorStop(0.15, 'rgba(0,0,0,0.0)')
  g.addColorStop(0.85, 'rgba(0,0,0,0.0)')
  g.addColorStop(1.0, 'rgba(0,0,0,0.85)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  return new CanvasTexture(canvas)
}

function createEarthBump() {
  const { width: W, height: H } = PROCEDURAL_TEXTURE_SIZES.earthDiffuse
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#252525'
  ctx.fillRect(0, 0, W, H)

  ctx.globalAlpha = 0.34
  ctx.fillStyle = '#8a8a8a'
  const ridges = [
    [[0.17,0.58],[0.19,0.66],[0.20,0.78],[0.18,0.88]],
    [[0.44,0.25],[0.50,0.30],[0.58,0.36],[0.62,0.48]],
    [[0.62,0.34],[0.66,0.42],[0.68,0.56]],
    [[0.72,0.18],[0.80,0.24],[0.86,0.32]],
  ]

  ridges.forEach((pts) => {
    ctx.beginPath()
    ctx.moveTo(pts[0][0] * W, pts[0][1] * H)
    pts.slice(1).forEach(([x, y]) => ctx.lineTo(x * W, y * H))
    ctx.lineWidth = 12
    ctx.lineCap = 'round'
    ctx.stroke()
  })

  ctx.globalAlpha = 0.08
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const v = 60 + Math.random() * 110
    ctx.fillStyle = `rgb(${v},${v},${v})`
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2)
  }

  ctx.globalAlpha = 1
  return new CanvasTexture(canvas)
}

// ─── Procedural cloud texture ──────────────────────────────────────────────────
function createCloudTexture() {
  const { width: W, height: H } = PROCEDURAL_TEXTURE_SIZES.earthClouds
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // Transparent base
  ctx.clearRect(0, 0, W, H)

  // Always returns a value in [0, 1)
  const seed = (n) => Math.abs((Math.sin(n * 9301 + 49297) * 233280) % 1)

  for (let i = 0; i < 220; i++) {
    const cx    = seed(i * 3)     * W
    const cy    = seed(i * 3 + 1) * H
    const rx    = Math.max(1, 20 + seed(i * 3 + 2) * 80)
    const ry    = Math.max(1, 10 + seed(i * 7)     * 30)
    const alpha = 0.3 + seed(i * 11) * 0.5

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx)
    grad.addColorStop(0,   `rgba(255,255,255,${alpha})`)
    grad.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.6})`)
    grad.addColorStop(1,   `rgba(255,255,255,0)`)
    ctx.fillStyle = grad
    ctx.save()
    ctx.scale(1, ry / rx)
    ctx.beginPath()
    ctx.arc(cx, cy * rx / ry, rx, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  return new CanvasTexture(canvas)
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Earth() {
  // Procedural textures (immediate fallback)
  const proceduralDiffuse  = useMemo(() => createEarthDiffuse(),  [])
  const proceduralClouds   = useMemo(() => createCloudTexture(),  [])
  const proceduralSpecular = useMemo(() => createEarthSpecular(), [])
  const proceduralBump     = useMemo(() => createEarthBump(),     [])
  const hemisphereQuat = useMemo(
    () => new Quaternion().setFromUnitVectors(LOCAL_UP, KSC_NORMAL.clone().normalize()),
    []
  )

  // Try loading real textures from /public/textures/
  const [diffuse, setDiffuse]   = useState(proceduralDiffuse)
  const [clouds,  setClouds]    = useState(proceduralClouds)
  const [specular, setSpecular] = useState(proceduralSpecular)
  const [bump, setBump]         = useState(proceduralBump)

  useEffect(() => {
    const loader = new TextureLoader()
    loader.load('/textures/earth_day.jpg',      t => setDiffuse(t))
    loader.load('/textures/earth_clouds.jpg',   t => setClouds(t))
    loader.load('/textures/earth_specular.jpg', t => setSpecular(t))
    loader.load('/textures/earth_bump.jpg',     t => setBump(t))
  }, [])

  return (
    <group quaternion={hemisphereQuat} position={[0, 0, 0]}>
      {/* Core land/ocean sphere — high shininess with ocean-only specular map
          creates a visible sun-glint on the ocean while continents stay matte. */}
      <mesh>
        <sphereGeometry args={HEMISPHERE_ARGS} />
        <meshPhongMaterial
          map={diffuse}
          bumpMap={bump}
          bumpScale={0.035}
          specularMap={specular}
          shininess={70}
          specular="#8ec5ff"
          emissive="#0a1428"
          emissiveIntensity={0.12}
          side={FrontSide}
        />
      </mesh>

      {/* Cloud layer — slightly larger offset so atmosphere glow rim shows behind */}
      <mesh>
        <sphereGeometry args={CLOUD_HEMISPHERE_ARGS} />
        <meshPhongMaterial
          map={clouds}
          transparent
          opacity={0.46}
          depthWrite={false}
          shininess={2}
          side={FrontSide}
        />
      </mesh>
    </group>
  )
}
