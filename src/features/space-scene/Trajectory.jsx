import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { CatmullRomCurve3, Color } from 'three'
import { useMission } from '@features/mission/MissionContext'
import {
  TRAJECTORY_CONTROL_POINTS,
  PHASE_SEGMENTS,
  CURVE_SAMPLES,
} from '@shared/constants/trajectory'

const fullCurve = new CatmullRomCurve3(TRAJECTORY_CONTROL_POINTS)

/** Sample `n` points on the curve between tStart and tEnd */
function sampleSegment(curve, tStart, tEnd, n = CURVE_SAMPLES) {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const t = tStart + (tEnd - tStart) * (i / n)
    pts.push(curve.getPointAt(Math.min(t, 0.9999)))
  }
  return pts
}

/** Precompute all segment point arrays once */
function buildSegments() {
  // Deduplicate overlapping segments (prox_ops overlaps orbit) — keep distinct
  const unique = PHASE_SEGMENTS.filter(s => s.id !== 'prox_ops')
  return unique.map(seg => ({
    ...seg,
    points: sampleSegment(fullCurve, seg.tStart, seg.tEnd),
  }))
}

const SEGMENTS = buildSegments()

/**
 * Trajectory — renders the full mission path as colored line segments.
 * The portion already traversed is bright; the future path is dimmed.
 */
export default function Trajectory() {
  const { tRef } = useMission()
  const groupRef = useRef()

  // Update segment opacity based on tRef each frame
  useFrame(() => {
    const t = tRef.current
    if (!groupRef.current) return
    groupRef.current.children.forEach((child, i) => {
      const seg = SEGMENTS[i]
      if (!seg) return
      const past = t >= seg.tEnd
      const active = t >= seg.tStart && t < seg.tEnd
      child.material.opacity = past ? 0.9 : active ? 1.0 : 0.25
    })
  })

  return (
    <group ref={groupRef}>
      {SEGMENTS.map((seg) => (
        <Line
          key={seg.id}
          points={seg.points}
          color={seg.color}
          lineWidth={1.8}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      ))}

      {/* Glow layer — wider, more transparent */}
      {SEGMENTS.map((seg) => (
        <Line
          key={`${seg.id}-glow`}
          points={seg.points}
          color={seg.glowColor}
          lineWidth={4}
          transparent
          opacity={0.07}
          depthWrite={false}
        />
      ))}
    </group>
  )
}
