import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, Line } from '@react-three/drei'
import * as THREE from 'three'
import { EARTH_RADIUS } from '@shared/constants/trajectory'

const KSC_LAT = 28.5
const KSC_LON = -80.5
const AXIAL_TILT    = 23.5 * Math.PI / 180
const ROTATION_SPEED = 0.05   // rad/s
const R = EARTH_RADIUS         // alias

function latLonToVec3(latDeg, lonDeg, radius) {
  const phi   = (90 - latDeg) * Math.PI / 180
  const theta = (lonDeg + 180) * Math.PI / 180
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta),
  )
}

function makeOrbitPoints(a, b, segments = 256) {
  const pts = []
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(t) * a, 0, Math.sin(t) * b))
  }
  return pts
}

const GLOW_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vPos = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const GLOW_FRAG = /* glsl */`
  uniform vec3  glowColor;
  uniform float power;
  uniform float intensity;
  varying vec3  vNormal;
  varying vec3  vPos;
  void main() {
    float f = pow(1.0 - abs(dot(vNormal, normalize(vPos))), power);
    gl_FragColor = vec4(glowColor, f * intensity);
  }
`

const TEXTURE_URLS = [
  'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
  'https://unpkg.com/three-globe/example/img/earth-topology.png',
  'https://unpkg.com/three-globe/example/img/earth-water.png',
  'https://unpkg.com/three-globe/example/img/earth-clouds.png',
]

export default function Earth() {
  const earthRef  = useRef()
  const cloudsRef = useRef()
  const haloRef   = useRef()

  const [texMap, texBump, texSpecular, texClouds] = useTexture(TEXTURE_URLS)

  const kscPos    = useMemo(() => latLonToVec3(KSC_LAT, KSC_LON, R * 1.005), [])
  const kscLookAt = useMemo(() => kscPos.clone().multiplyScalar(2), [kscPos])

  const glowUniforms = useMemo(() => ({
    glowColor: { value: new THREE.Color(0x4aa3ff) },
    power:     { value: 2.6 },
    intensity: { value: 0.9 },
  }), [])

  // ISS orbit — 400 km above surface, inclined 51.6°
  const issPoints = useMemo(() => makeOrbitPoints(R + 0.4 * (R / 6.371), R + 0.4 * (R / 6.371)), [])

  // Lunar Transfer Orbit — compressed ellipse (apogee ~12.5×R), inclined 28.5°
  const { ltoPoints, ltoOffset } = useMemo(() => {
    const apogee  = R * 12.5
    const perigee = R + 0.3 * (R / 6.371)
    const a = (apogee + perigee) / 2
    const c = (apogee - perigee) / 2
    const b = Math.sqrt(a * a - c * c)
    return { ltoPoints: makeOrbitPoints(a, b, 384), ltoOffset: c }
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    if (earthRef.current)  earthRef.current.rotation.y  += ROTATION_SPEED * dt
    if (cloudsRef.current) cloudsRef.current.rotation.y += ROTATION_SPEED * 1.15 * dt
    if (haloRef.current) {
      const now = performance.now()
      const s = 1 + Math.sin(now * 0.004) * 0.25
      haloRef.current.scale.setScalar(s)
      haloRef.current.material.opacity = Math.max(0, 0.7 - (s - 1) * 1.6)
    }
  })

  return (
    <>
      {/* ── Earth group — tilted on Z (axial tilt 23.5°) ── */}
      <group rotation={[0, 0, AXIAL_TILT]}>

        {/* Surface */}
        <mesh ref={earthRef}>
          <sphereGeometry args={[R, 64, 64]} />
          <meshPhongMaterial
            map={texMap}
            bumpMap={texBump}
            bumpScale={0.05 * (R / 6.371)}
            specularMap={texSpecular}
            specular={new THREE.Color(0x223344)}
            shininess={18}
          />
        </mesh>

        {/* Clouds — offset sphere, rotates slightly faster */}
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[R * 1.005, 64, 64]} />
          <meshPhongMaterial
            map={texClouds}
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </mesh>

        {/* Atmosphere — inner soft blue halo */}
        <mesh>
          <sphereGeometry args={[R * 1.02, 64, 64]} />
          <meshPhongMaterial
            color={0x4488ff}
            transparent
            opacity={0.15}
            side={THREE.FrontSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Atmospheric glow — back-side fresnel shader */}
        <mesh>
          <sphereGeometry args={[R * 1.18, 64, 64]} />
          <shaderMaterial
            transparent
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            uniforms={glowUniforms}
            vertexShader={GLOW_VERT}
            fragmentShader={GLOW_FRAG}
          />
        </mesh>

        {/* KSC marker — red dot at Kennedy Space Center */}
        <mesh position={kscPos}>
          <sphereGeometry args={[R * 0.012, 16, 16]} />
          <meshBasicMaterial color={0xff3322} />
        </mesh>

        {/* KSC pulsing halo ring */}
        <mesh
          ref={haloRef}
          position={kscPos}
          onUpdate={(self) => self.lookAt(kscLookAt)}
        >
          <ringGeometry args={[R * 0.018, R * 0.028, 32]} />
          <meshBasicMaterial
            color={0xff5544}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ── Orbits — in world space (not tilted with Earth) ── */}

      {/* ISS reference orbit */}
      <Line
        points={issPoints}
        color="#ffffff"
        lineWidth={1.25}
        transparent
        opacity={0.35}
        depthWrite={false}
        rotation={[51.6 * Math.PI / 180, 0, 0]}
      />

      {/* Lunar Transfer Orbit — dashed, eccentric ellipse */}
      <group position={[-ltoOffset, 0, 0]} rotation={[28.5 * Math.PI / 180, 0, 0]}>
        <Line
          points={ltoPoints}
          color="#88bbff"
          lineWidth={1.35}
          transparent
          opacity={0.45}
          depthWrite={false}
          dashed
          dashSize={0.3 * (R / 6.371)}
          gapSize={0.2 * (R / 6.371)}
        />
      </group>
    </>
  )
}
