import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMission } from '@features/mission/MissionContext'
import { MISSION_PHASES } from '@shared/constants/mission'

const TRAIL_LENGTH = 80
const THRUST_PHASES = new Set([
  MISSION_PHASES.LAUNCH,
  MISSION_PHASES.TLI,
  MISSION_PHASES.REENTRY,
])

const _clampedSpeed = (s) => Math.min(1, s / 4.5)

/**
 * RocketTrail — renders a fading trail behind the rocket during thrust phases.
 * Uses a line of points that follow the rocket position with decay.
 */
export default function RocketTrail({ rocketRef }) {
  const pointsRef = useRef()
  const { phase, tRef, flightRef } = useMission()
  const worldPosition = useMemo(() => new THREE.Vector3(), [])
  const tailPosition = useMemo(() => new THREE.Vector3(), [])

  const trailData = useMemo(() => {
    const positions = new Float32Array(TRAIL_LENGTH * 3)
    const colors = new Float32Array(TRAIL_LENGTH * 3)
    const sizes = new Float32Array(TRAIL_LENGTH)
    const alphas = new Float32Array(TRAIL_LENGTH)
    return { positions, colors, sizes, alphas, initialized: false, frameCount: 0 }
  }, [])

  const trailMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `
      attribute float size;
      attribute float alpha;
      attribute vec3 trailColor;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = trailColor;
        vAlpha = alpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (260.0 / max(1.0, -mvPosition.z));
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        float softDisc = 1.0 - smoothstep(0.08, 0.5, dist);
        gl_FragColor = vec4(vColor, softDisc * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [])

  useFrame(() => {
    if (!rocketRef?.current || !pointsRef.current) return

    const active = THRUST_PHASES.has(phase) && tRef.current > 0.001
    const geo = pointsRef.current.geometry
    const { positions, colors, sizes, alphas } = trailData

    trailData.frameCount++
    // Update every 2nd frame for performance
    if (trailData.frameCount % 2 !== 0) return

    if (active) {
      rocketRef.current.getWorldPosition(worldPosition)
      const flight = flightRef?.current
      if (flight?.position && flight?.forward) {
        tailPosition.copy(flight.position).addScaledVector(flight.forward, -0.12)
      } else {
        tailPosition.copy(worldPosition)
      }

      // Shift all positions back
      for (let i = TRAIL_LENGTH - 1; i > 0; i--) {
        positions[i * 3] = positions[(i - 1) * 3]
        positions[i * 3 + 1] = positions[(i - 1) * 3 + 1]
        positions[i * 3 + 2] = positions[(i - 1) * 3 + 2]
      }

      // New head position
      positions[0] = tailPosition.x
      positions[1] = tailPosition.y
      positions[2] = tailPosition.z

      if (!trailData.initialized) {
        // Fill all positions with current pos
        for (let i = 0; i < TRAIL_LENGTH; i++) {
          positions[i * 3] = tailPosition.x
          positions[i * 3 + 1] = tailPosition.y
          positions[i * 3 + 2] = tailPosition.z
        }
        trailData.initialized = true
      }

      // Color gradient: bright at head, fading to transparent.
      // Overall intensity scales with current velocity so the flame trail
      // visibly stretches and brightens as the rocket accelerates.
      const speed = flightRef?.current?.speed ?? 0
      const vIntensity = 0.45 + 0.55 * _clampedSpeed(speed)
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const frac = 1 - i / TRAIL_LENGTH
        const alpha = frac * frac * vIntensity
        // Orange-white at head, fading to blue
        colors[i * 3] = 0.3 + alpha * 0.7     // R
        colors[i * 3 + 1] = 0.4 + alpha * 0.4 // G
        colors[i * 3 + 2] = 0.6 + alpha * 0.3 // B
        sizes[i] = 0.08 + frac * 0.22
        alphas[i] = alpha * 0.72
      }
    } else {
      // Fade out trail when not thrusting
      trailData.initialized = false
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        colors[i * 3] *= 0.92
        colors[i * 3 + 1] *= 0.92
        colors[i * 3 + 2] *= 0.92
        sizes[i] *= 0.96
        alphas[i] *= 0.88
      }
    }

    geo.attributes.position.needsUpdate = true
    geo.attributes.trailColor.needsUpdate = true
    geo.attributes.size.needsUpdate = true
    geo.attributes.alpha.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={TRAIL_LENGTH}
          array={trailData.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-trailColor"
          count={TRAIL_LENGTH}
          array={trailData.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={TRAIL_LENGTH}
          array={trailData.sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-alpha"
          count={TRAIL_LENGTH}
          array={trailData.alphas}
          itemSize={1}
        />
      </bufferGeometry>
      <primitive object={trailMaterial} attach="material" />
    </points>
  )
}
