import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMission, LAUNCH_SUBPHASES } from '@features/mission/MissionContext'

function makeProceduralTexture({ base, accent, lineEvery = 24, noise = 20 }) {
  if (typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let y = 0; y < canvas.height; y++) {
    const alpha = 0.05 + Math.random() * 0.10
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.fillRect(0, y, canvas.width, 1)
  }

  ctx.strokeStyle = accent
  for (let y = lineEvery; y < canvas.height; y += lineEvery) {
    ctx.globalAlpha = 0.22 + Math.random() * 0.12
    ctx.beginPath()
    ctx.moveTo(0, y + Math.random() * noise * 0.04)
    ctx.lineTo(canvas.width, y + Math.random() * noise * 0.04)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 1)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * RocketModel — detailed procedural SLS Block 1 Crew.
 * Rocket axis (nose → tail) is along local +Y.
 */
export default function RocketModel({ thrustActive = false }) {
  const { flightRef, subPhaseRef, subPhaseTimeRef } = useMission()
  const plumeGroupRef = useRef()
  const exhaustRef = useRef()
  const plume1Ref = useRef()
  const plume2Ref = useRef()
  const plume3Ref = useRef()
  const srbPlumesRef = useRef([])
  const particlesRef = useRef()
  const heatShimmerRef = useRef()

  const surfaceMaps = useMemo(() => ({
    foam: makeProceduralTexture({ base: '#c46a2a', accent: '#8f3f12', lineEvery: 15, noise: 34 }),
    white: makeProceduralTexture({ base: '#eeeeea', accent: '#b7b7b0', lineEvery: 36, noise: 14 }),
    dark: makeProceduralTexture({ base: '#343434', accent: '#111111', lineEvery: 20, noise: 18 }),
  }), [])

  const materials = useMemo(() => ({
    coreFoam: new THREE.MeshStandardMaterial({
      color: '#c46a2a',
      map: surfaceMaps.foam,
      bumpMap: surfaceMaps.foam,
      bumpScale: 0.018,
      metalness: 0.08,
      roughness: 0.82,
    }),
    whitePaint: new THREE.MeshStandardMaterial({
      color: '#f0f0ec',
      map: surfaceMaps.white,
      bumpMap: surfaceMaps.white,
      bumpScale: 0.006,
      metalness: 0.28,
      roughness: 0.48,
    }),
    nozzle: new THREE.MeshStandardMaterial({
      color: '#3a3a3a',
      map: surfaceMaps.dark,
      bumpMap: surfaceMaps.dark,
      bumpScale: 0.01,
      metalness: 0.92,
      roughness: 0.18,
    }),
    blackTile: new THREE.MeshStandardMaterial({
      color: '#1f2428',
      metalness: 0.35,
      roughness: 0.62,
    }),
    orangeMarking: new THREE.MeshStandardMaterial({
      color: '#d84b22',
      metalness: 0.22,
      roughness: 0.56,
    }),
  }), [surfaceMaps])

  // Particle system for exhaust
  const particleData = useMemo(() => {
    const count = 120
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const lifetimes = new Float32Array(count)
    const sizes = new Float32Array(count)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = -1.2 - Math.random() * 1.5
      positions[i * 3 + 2] = 0
      velocities[i * 3] = (Math.random() - 0.5) * 0.15
      velocities[i * 3 + 1] = -(0.8 + Math.random() * 1.2)
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.15
      lifetimes[i] = Math.random()
      sizes[i] = 0.02 + Math.random() * 0.04

      // Orange to yellow gradient
      const temp = Math.random()
      colors[i * 3] = 1.0
      colors[i * 3 + 1] = 0.3 + temp * 0.5
      colors[i * 3 + 2] = temp * 0.15
    }

    return { count, positions, velocities, lifetimes, sizes, colors }
  }, [])

  // Animate exhaust and particles
  useFrame(({ clock }, delta) => {
    if (!thrustActive) {
      if (particlesRef.current) particlesRef.current.visible = false
      return
    }

    const t = clock.getElapsedTime()
    const flicker = 0.88 + 0.12 * Math.sin(t * 40 + Math.random() * 0.3)
    const flicker2 = 0.90 + 0.10 * Math.sin(t * 55 + 1.5)

    // Velocity-driven plume scale: bigger flame when accelerating hard.
    // speed is in scene units / second — typical max ~6.
    const speed = flightRef?.current?.speed ?? 0
    const speedNorm = Math.min(1, speed / 4.5)
    const sub = subPhaseRef?.current ?? LAUNCH_SUBPHASES.NONE
    const subTime = subPhaseTimeRef?.current ?? 0

    // Ignition burst: plumes bloom in smoothly over ~0.6s after ignition, then settle.
    let ignitionBoost = 0
    if (sub === LAUNCH_SUBPHASES.IGNITION) {
      const k = Math.min(1, subTime / 0.55)
      ignitionBoost = k * k * (3 - 2 * k) // smoothstep
    } else if (sub === LAUNCH_SUBPHASES.LIFTOFF) {
      ignitionBoost = 1 - Math.min(1, subTime / 0.4)
    }
    const plumeLen = 0.65 + 0.55 * speedNorm + 0.40 * ignitionBoost
    const plumeWid = 0.90 + 0.20 * speedNorm + 0.20 * ignitionBoost

    if (plumeGroupRef.current) {
      // Ease the scale smoothly toward target each frame
      const g = plumeGroupRef.current
      const k = 1 - Math.exp(-8 * delta)
      g.scale.y += (plumeLen - g.scale.y) * k
      g.scale.x += (plumeWid - g.scale.x) * k
      g.scale.z += (plumeWid - g.scale.z) * k
    }

    if (exhaustRef.current) {
      if (exhaustRef.current.material.uniforms) {
        exhaustRef.current.material.uniforms.uTime.value = t
        exhaustRef.current.material.uniforms.uOpacity.value = flicker * (0.92 + 0.08 * speedNorm)
      } else {
        exhaustRef.current.material.opacity = flicker * (0.92 + 0.08 * speedNorm)
      }
      exhaustRef.current.scale.x = 0.95 + 0.05 * Math.sin(t * 35)
      exhaustRef.current.scale.z = 0.95 + 0.05 * Math.cos(t * 38)
    }
    if (plume1Ref.current) {
      plume1Ref.current.material.opacity = flicker * (0.55 + 0.18 * speedNorm)
      plume1Ref.current.scale.y = 0.95 + 0.08 * Math.sin(t * 25)
    }
    if (plume2Ref.current) {
      plume2Ref.current.material.opacity = flicker2 * (0.22 + 0.18 * speedNorm)
      plume2Ref.current.scale.y = 0.92 + 0.10 * Math.sin(t * 20)
    }
    if (plume3Ref.current) {
      plume3Ref.current.material.opacity = flicker2 * (0.08 + 0.14 * speedNorm)
    }
    if (heatShimmerRef.current) {
      heatShimmerRef.current.material.opacity = 0.06 + 0.04 * Math.sin(t * 15) + 0.06 * ignitionBoost
      heatShimmerRef.current.scale.x = 1 + 0.08 * Math.sin(t * 12)
      heatShimmerRef.current.scale.z = 1 + 0.08 * Math.cos(t * 14)
    }

    // SRB plume animation — brightens with velocity and during ignition burst
    const srbOpacity = flicker * (0.70 + 0.20 * speedNorm + 0.15 * ignitionBoost)
    srbPlumesRef.current.forEach((ref) => {
      if (ref) ref.material.opacity = srbOpacity
    })

    // Particle animation
    if (particlesRef.current) {
      particlesRef.current.visible = true
      const geo = particlesRef.current.geometry
      const pos = geo.attributes.position.array
      const { count, velocities, lifetimes } = particleData

      for (let i = 0; i < count; i++) {
        lifetimes[i] -= delta * (1.5 + Math.random() * 0.5)
        if (lifetimes[i] <= 0) {
          // Reset particle
          lifetimes[i] = 1.0
          const angle = Math.random() * Math.PI * 2
          const spread = Math.random() * 0.08
          pos[i * 3] = Math.cos(angle) * spread
          pos[i * 3 + 1] = -0.95
          pos[i * 3 + 2] = Math.sin(angle) * spread
        } else {
          pos[i * 3] += velocities[i * 3] * delta
          pos[i * 3 + 1] += velocities[i * 3 + 1] * delta
          pos[i * 3 + 2] += velocities[i * 3 + 2] * delta
        }
      }
      geo.attributes.position.needsUpdate = true

      // Fade particle sizes based on lifetime
      const sizeAttr = geo.attributes.size
      for (let i = 0; i < count; i++) {
        sizeAttr.array[i] = particleData.sizes[i] * lifetimes[i]
      }
      sizeAttr.needsUpdate = true
    }
  })

  // Custom shader material for particles
  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        attribute float size;
        attribute vec3 particleColor;
        varying vec3 vColor;
        void main() {
          vColor = particleColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, d);
          gl_FragColor = vec4(vColor, alpha * 0.7);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  const plumeMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.85 },
      uInner: { value: new THREE.Color('#fff6cf') },
      uMid: { value: new THREE.Color('#ff8a18') },
      uOuter: { value: new THREE.Color('#d43100') },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uInner;
      uniform vec3 uMid;
      uniform vec3 uOuter;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        float radial = length(vUv - vec2(0.5));
        float turbulence = hash(vUv * 18.0 + uTime * 2.3) * 0.18;
        float core = 1.0 - smoothstep(0.02, 0.46, radial + turbulence * 0.35);
        float falloff = 1.0 - smoothstep(0.12, 0.56, radial);
        float lengthFade = 1.0 - smoothstep(0.12, 1.0, vUv.y);
        vec3 color = mix(uOuter, uMid, falloff);
        color = mix(color, uInner, core);
        gl_FragColor = vec4(color, falloff * lengthFade * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  }), [])

  return (
    <group>

      {/* ── Core Stage ── */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.170, 0.178, 1.56, 40]} />
        <primitive object={materials.coreFoam} attach="material" />
      </mesh>

      <mesh position={[0, 0.71, 0]}>
        <cylinderGeometry args={[0.168, 0.170, 0.18, 40]} />
        <primitive object={materials.whitePaint} attach="material" />
      </mesh>

      <mesh position={[0, -0.70, 0]}>
        <cylinderGeometry args={[0.182, 0.175, 0.22, 40]} />
        <primitive object={materials.whitePaint} attach="material" />
      </mesh>

      {/* Core stage vertical weld lines */}
      {[0, 90, 180, 270].map((deg, i) => {
        const a = deg * Math.PI / 180
        const r = 0.176
        return (
          <mesh key={`weld-${i}`} position={[Math.sin(a) * r, 0, Math.cos(a) * r]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.003, 1.45, 0.001]} />
            <meshStandardMaterial color="#c8c8c8" metalness={0.7} roughness={0.25} />
          </mesh>
        )
      })}

      {/* Orange foam insulation band */}
      <mesh position={[0, -0.30, 0]}>
        <cylinderGeometry args={[0.170, 0.170, 0.28, 24]} />
        <primitive object={materials.coreFoam} attach="material" />
      </mesh>

      {/* Foam texture rings */}
      {[-0.20, -0.30, -0.40].map((y, i) => (
        <mesh key={`foam-ring-${i}`} position={[0, y, 0]}>
          <torusGeometry args={[0.171, 0.002, 6, 24]} />
          <meshStandardMaterial color="#a84e12" metalness={0.15} roughness={0.8} />
        </mesh>
      ))}

      {/* ── Interstage (ICPS adapter) ── */}
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.132, 0.165, 0.22, 24]} />
        <meshStandardMaterial color="#cccccc" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Interstage separation ring */}
      <mesh position={[0, 0.71, 0]}>
        <torusGeometry args={[0.166, 0.004, 8, 24]} />
        <meshStandardMaterial color="#999" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ── ICPS upper stage ── */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.115, 0.130, 0.36, 24]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.6} roughness={0.35} />
      </mesh>

      {/* ICPS insulation panel */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.116, 0.131, 0.34, 24]} />
        <meshStandardMaterial color="#d4d0cc" metalness={0.4} roughness={0.5} transparent opacity={0.6} />
      </mesh>

      {/* ── Orion Service Module ── */}
      <mesh position={[0, 1.34, 0]}>
        <cylinderGeometry args={[0.120, 0.115, 0.28, 24]} />
        <meshStandardMaterial color="#bbbbc0" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* SM thermal radiator panels */}
      {[0, 120, 240].map((deg, i) => {
        const a = deg * Math.PI / 180
        const r = 0.122
        return (
          <mesh key={`radiator-${i}`} position={[Math.sin(a) * r, 1.34, Math.cos(a) * r]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.04, 0.22, 0.002]} />
            <meshStandardMaterial color="#9a9aa0" metalness={0.6} roughness={0.3} />
          </mesh>
        )
      })}

      {/* SM solar panels (4x cross pattern) */}
      {[
        { side: -1, z: 0 },
        { side: 1, z: 0 },
        { side: 0, z: -1 },
        { side: 0, z: 1 },
      ].map(({ side, z }, i) => (
        <group key={`solar-${i}`} position={[side * 0.24, 1.34, z * 0.24]}>
          {/* Panel arm */}
          <mesh position={[side * 0.06, 0, z * 0.06]}>
            <boxGeometry args={[0.005, 0.005, side !== 0 ? 0.12 : 0.005]} />
            <meshStandardMaterial color="#888" metalness={0.8} />
          </mesh>
          {side !== 0 && (
            <mesh position={[side * 0.06, 0, z * 0.06]}>
              <boxGeometry args={[0.005, 0.005, 0.005]} />
              <meshStandardMaterial color="#888" metalness={0.8} />
            </mesh>
          )}
          {/* Solar panel */}
          <mesh position={[side * 0.13, 0, z * 0.13]}
            rotation={[z !== 0 ? 0 : 0, 0, side !== 0 ? side * 0.15 : 0]}>
            <boxGeometry args={[
              side !== 0 ? 0.22 : 0.10,
              0.04,
              z !== 0 ? 0.22 : 0.10
            ]} />
            <meshStandardMaterial color="#1a3a6a" metalness={0.8} roughness={0.2} emissive="#0a1a3a" emissiveIntensity={0.15} />
          </mesh>
          {/* Panel grid lines */}
          <mesh position={[side * 0.13, 0.021, z * 0.13]}>
            <boxGeometry args={[
              side !== 0 ? 0.22 : 0.10,
              0.001,
              z !== 0 ? 0.22 : 0.10
            ]} />
            <meshStandardMaterial color="#0e2a50" metalness={0.9} roughness={0.1} wireframe />
          </mesh>
        </group>
      ))}

      {/* ── Orion Crew Module ── */}
      <mesh position={[0, 1.57, 0]}>
        <cylinderGeometry args={[0.098, 0.118, 0.20, 24]} />
        <meshStandardMaterial color="#c8401a" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* CM heat shield bottom */}
      <mesh position={[0, 1.47, 0]}>
        <cylinderGeometry args={[0.119, 0.119, 0.01, 24]} />
        <meshStandardMaterial color="#3d2b1a" metalness={0.2} roughness={0.9} />
      </mesh>

      {/* CM windows — recessed with glass effect */}
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const r = 0.107
        const a = deg * Math.PI / 180
        return (
          <group key={`window-${i}`} position={[Math.sin(a) * r, 1.60, Math.cos(a) * r]}>
            {/* Window frame */}
            <mesh rotation={[0, -a, 0]}>
              <circleGeometry args={[0.014, 12]} />
              <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Glass */}
            <mesh position={[0, 0, 0]} rotation={[0, -a, 0]}>
              <circleGeometry args={[0.011, 12]} />
              <meshStandardMaterial
                color="#88ccff"
                emissive="#3388cc"
                emissiveIntensity={0.5}
                metalness={0.9}
                roughness={0.1}
                transparent
                opacity={0.85}
              />
            </mesh>
          </group>
        )
      })}

      {/* ── Launch Abort System (LAS) ── */}
      {/* LAS fairing */}
      <mesh position={[0, 1.73, 0]}>
        <coneGeometry args={[0.095, 0.16, 24]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* LAS tower (lattice structure — 3 struts) */}
      {[0, 120, 240].map((deg, i) => {
        const a = deg * Math.PI / 180
        const r = 0.018
        return (
          <mesh key={`las-strut-${i}`}
            position={[Math.sin(a) * r, 1.90, Math.cos(a) * r]}>
            <cylinderGeometry args={[0.004, 0.004, 0.30, 4]} />
            <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
          </mesh>
        )
      })}

      {/* LAS cross-braces */}
      {[1.80, 1.90, 2.00].map((y, i) => (
        <mesh key={`las-brace-${i}`} position={[0, y, 0]}>
          <torusGeometry args={[0.018, 0.002, 4, 6]} />
          <meshStandardMaterial color="#777" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* LAS motor */}
      <mesh position={[0, 2.06, 0]}>
        <cylinderGeometry args={[0.024, 0.016, 0.08, 12]} />
        <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* LAS tip */}
      <mesh position={[0, 2.12, 0]}>
        <coneGeometry args={[0.010, 0.05, 8]} />
        <meshStandardMaterial color="#ff3300" metalness={0.3} roughness={0.5} />
      </mesh>

      {/* ── Solid Rocket Boosters (2x) ── */}
      {[-1, 1].map((side, i) => (
        <group key={`srb-${i}`} position={[side * 0.225, 0.05, 0]}>
          {/* SRB body */}
          <mesh>
            <cylinderGeometry args={[0.060, 0.060, 1.42, 24]} />
            <primitive object={materials.whitePaint} attach="material" />
          </mesh>

          {/* SRB segment joint rings */}
          {[-0.52, -0.25, 0.02, 0.29, 0.56].map((y, j) => (
            <mesh key={`srb-ring-${j}`} position={[0, y, 0]}>
              <torusGeometry args={[0.059, 0.003, 6, 16]} />
              <meshStandardMaterial color="#ccc" metalness={0.7} roughness={0.25} />
            </mesh>
          ))}

          {/* SRB nose */}
          <mesh position={[0, 0.86, 0]}>
            <coneGeometry args={[0.060, 0.26, 24]} />
            <primitive object={materials.whitePaint} attach="material" />
          </mesh>

          {/* SRB nose tip */}
          <mesh position={[0, 1.01, 0]}>
            <coneGeometry args={[0.012, 0.06, 8]} />
            <meshStandardMaterial color="#aaa" metalness={0.6} roughness={0.3} />
          </mesh>

          <mesh position={[0, 0.06, 0.061]}>
            <boxGeometry args={[0.050, 0.96, 0.002]} />
            <primitive object={materials.blackTile} attach="material" />
          </mesh>

          {/* SRB forward separation motor bumps */}
          {[0, 90, 180, 270].map((deg, j) => {
            const a = deg * Math.PI / 180
            return (
              <mesh key={`sep-${j}`} position={[Math.sin(a) * 0.06, 0.60, Math.cos(a) * 0.06]}>
                <sphereGeometry args={[0.007, 6, 6]} />
                <meshStandardMaterial color="#bbb" metalness={0.5} roughness={0.5} />
              </mesh>
            )
          })}

          {/* SRB aft skirt */}
          <mesh position={[0, -0.82, 0]}>
            <cylinderGeometry args={[0.066, 0.058, 0.16, 16]} />
            <meshStandardMaterial color="#cccccc" metalness={0.6} roughness={0.35} />
          </mesh>

          {/* SRB attach struts to core */}
          <mesh position={[side * -0.10, 0.15, 0]} rotation={[0, 0, side * 0.15]}>
            <boxGeometry args={[0.10, 0.008, 0.015]} />
            <meshStandardMaterial color="#999" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[side * -0.10, -0.25, 0]} rotation={[0, 0, side * 0.15]}>
            <boxGeometry args={[0.10, 0.008, 0.015]} />
            <meshStandardMaterial color="#999" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* SRB nozzle */}
          <mesh position={[0, -0.96, 0]}>
            <cylinderGeometry args={[0.040, 0.058, 0.14, 16]} />
            <primitive object={materials.nozzle} attach="material" />
          </mesh>
          {/* Nozzle inner glow ring */}
          <mesh position={[0, -0.89, 0]}>
            <torusGeometry args={[0.040, 0.003, 6, 16]} />
            <meshStandardMaterial color="#333" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* ── RS-25 Engine nozzles (4x) with bell detail ── */}
      {[[-0.068, -0.068], [0.068, -0.068], [-0.068, 0.068], [0.068, 0.068]].map(([x, z], i) => (
        <group key={`rs25-${i}`} position={[x, -0.82, z]}>
          {/* Nozzle bell */}
          <mesh>
            <cylinderGeometry args={[0.028, 0.048, 0.14, 16]} />
            <primitive object={materials.nozzle} attach="material" />
          </mesh>
          {/* Nozzle extension rim */}
          <mesh position={[0, -0.07, 0]}>
            <torusGeometry args={[0.048, 0.002, 6, 16]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Inner throat glow (visible during thrust) */}
          {thrustActive && (
            <mesh position={[0, 0.05, 0]}>
              <circleGeometry args={[0.026, 12]} />
              <meshBasicMaterial color="#ffeecc" transparent opacity={0.8} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}

      {/* ── NASA/SLS markings (simplified colored bands) ── */}
      {/* NASA worm logo band area */}
      <mesh position={[0, 0.45, 0.167]}>
        <boxGeometry args={[0.06, 0.025, 0.001]} />
        <primitive object={materials.orangeMarking} attach="material" />
      </mesh>

      {/* USA text area */}
      <mesh position={[0, 0.20, 0.172]}>
        <boxGeometry args={[0.04, 0.015, 0.001]} />
        <meshStandardMaterial color="#1a1a6a" metalness={0.3} roughness={0.5} />
      </mesh>

      {/* ── Engine Exhaust Plume ── (visible during thrust phases) */}
      {thrustActive && (
        <group position={[0, -0.97, 0]} ref={plumeGroupRef}>
          {/* RS-25 core plume — white-hot inner cone */}
          <mesh ref={exhaustRef}>
            <coneGeometry args={[0.07, 0.65, 20]} rotation={[Math.PI, 0, 0]} />
            <primitive object={plumeMaterial} attach="material" />
          </mesh>

          {/* Hot orange expansion zone */}
          <mesh ref={plume1Ref} position={[0, -0.38, 0]}>
            <coneGeometry args={[0.16, 0.70, 20]} rotation={[Math.PI, 0, 0]} />
            <meshBasicMaterial
              color="#ff8800"
              transparent
              opacity={0.6}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Mid plume — reddish-orange */}
          <mesh ref={plume2Ref} position={[0, -0.72, 0]}>
            <coneGeometry args={[0.28, 0.85, 18]} rotation={[Math.PI, 0, 0]} />
            <meshBasicMaterial
              color="#ff4400"
              transparent
              opacity={0.28}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Outer diffuse glow */}
          <mesh ref={plume3Ref} position={[0, -1.0, 0]}>
            <coneGeometry args={[0.42, 1.1, 16]} rotation={[Math.PI, 0, 0]} />
            <meshBasicMaterial
              color="#ff2200"
              transparent
              opacity={0.12}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Heat shimmer sphere around exhaust */}
          <mesh ref={heatShimmerRef} position={[0, -0.5, 0]}>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshBasicMaterial
              color="#ffaa44"
              transparent
              opacity={0.06}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* SRB plumes (2x) — denser, more orange */}
          {[-1, 1].map((side, i) => (
            <group key={`srb-plume-${i}`} position={[side * 0.225, 0.08, 0]}>
              {/* Inner bright core */}
              <mesh ref={el => { if (srbPlumesRef.current) srbPlumesRef.current[i * 2] = el }}>
                <coneGeometry args={[0.05, 0.50, 14]} rotation={[Math.PI, 0, 0]} />
                <meshBasicMaterial
                  color="#ffcc00"
                  transparent
                  opacity={0.80}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              {/* Outer SRB plume */}
              <mesh
                ref={el => { if (srbPlumesRef.current) srbPlumesRef.current[i * 2 + 1] = el }}
                position={[0, -0.30, 0]}
              >
                <coneGeometry args={[0.10, 0.50, 12]} rotation={[Math.PI, 0, 0]} />
                <meshBasicMaterial
                  color="#ff6600"
                  transparent
                  opacity={0.40}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              {/* SRB smoke trail hint */}
              <mesh position={[0, -0.55, 0]}>
                <coneGeometry args={[0.14, 0.40, 10]} rotation={[Math.PI, 0, 0]} />
                <meshBasicMaterial
                  color="#cc8844"
                  transparent
                  opacity={0.15}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            </group>
          ))}

          {/* Particle system for exhaust sparks */}
          <points ref={particlesRef} visible={false}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={particleData.count}
                array={particleData.positions}
                itemSize={3}
              />
              <bufferAttribute
                attach="attributes-size"
                count={particleData.count}
                array={particleData.sizes}
                itemSize={1}
              />
              <bufferAttribute
                attach="attributes-particleColor"
                count={particleData.count}
                array={particleData.colors}
                itemSize={3}
              />
            </bufferGeometry>
            <primitive object={particleMaterial} attach="material" />
          </points>
        </group>
      )}

    </group>
  )
}
