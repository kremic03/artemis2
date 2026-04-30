import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, Billboard } from '@react-three/drei'
import { CatmullRomCurve3, Vector3 } from 'three'
import { useMission } from '@features/mission/MissionContext'
import { WAYPOINTS, TRAJECTORY_CONTROL_POINTS } from '@shared/constants/trajectory'

const curve = new CatmullRomCurve3(TRAJECTORY_CONTROL_POINTS)

// Precompute 3D positions for each waypoint
const WAYPOINT_POSITIONS = WAYPOINTS.map(wp => ({
  ...wp,
  position: curve.getPointAt(wp.t === 1 ? 0.9999 : wp.t),
}))

function WaypointMarker({ waypoint, isActive, isPast }) {
  const { jumpToWaypoint } = useMission()
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef()

  useFrame((_, delta) => {
    if (meshRef.current) {
      const target = hovered ? 0.9 : isPast ? 0.7 : 0.4
      // Framerate-independent exponential smoothing (ease-out).
      const k = 1 - Math.exp(-6 * delta)
      meshRef.current.material.opacity +=
        (target - meshRef.current.material.opacity) * k
    }
  })

  return (
    <Billboard position={waypoint.position} follow>
      {/* Dot */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); jumpToWaypoint(waypoint) }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
      >
        <circleGeometry args={[hovered ? 0.28 : 0.18, 16]} />
        <meshBasicMaterial
          color={isActive ? '#ffffff' : waypoint.color}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Number label */}
      <Html
        center
        distanceFactor={60}
        occlude={false}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          color: isActive ? '#fff' : isPast ? waypoint.color : 'rgba(255,255,255,0.45)',
          fontSize: '11px',
          fontFamily: 'Courier New, monospace',
          fontWeight: 'bold',
          textShadow: `0 0 8px ${waypoint.color}`,
          userSelect: 'none',
          cursor: 'pointer',
          pointerEvents: 'all',
          padding: '1px 4px',
          border: isActive ? `1px solid ${waypoint.color}` : '1px solid transparent',
          background: isActive ? 'rgba(0,0,0,0.7)' : 'transparent',
          transition: 'all 0.2s',
        }}
          onClick={() => jumpToWaypoint(waypoint)}
          title={waypoint.label}
        >
          {waypoint.id}
        </div>
      </Html>

      {/* Hover tooltip */}
      {hovered && (
        <Html
          center
          distanceFactor={60}
          style={{ pointerEvents: 'none', zIndex: 10 }}
        >
          <div style={{
            position: 'absolute',
            left: '14px',
            top: '-10px',
            background: 'rgba(0,0,0,0.85)',
            border: `1px solid ${waypoint.color}`,
            color: '#fff',
            fontSize: '10px',
            fontFamily: 'Courier New, monospace',
            padding: '4px 8px',
            whiteSpace: 'nowrap',
            boxShadow: `0 0 10px ${waypoint.color}40`,
          }}>
            <div style={{ color: waypoint.color, marginBottom: 2 }}>{waypoint.label}</div>
            <div style={{ opacity: 0.7, maxWidth: 200, whiteSpace: 'normal', lineHeight: 1.4 }}>
              {waypoint.shortDesc}
            </div>
          </div>
        </Html>
      )}
    </Billboard>
  )
}

export default function WaypointMarkers() {
  const { tRef, phase } = useMission()
  const groupRef = useRef()

  // We need reactive t for active/past state — but reading tRef in useFrame
  // and setting local state would cause re-renders. Instead we update via direct
  // DOM manipulation through a ref trick. Simpler: just re-render at low cost.
  // Actually, let's use a frame-gated counter to limit re-renders.
  const frameCount = useRef(0)
  const lastRenderT = useRef(0)
  const [renderT, setRenderT] = useState(0)

  useFrame(() => {
    frameCount.current++
    if (frameCount.current % 6 === 0) {   // ~10 fps update for UI
      const nextT = tRef.current
      if (Math.abs(nextT - lastRenderT.current) >= 0.008) {
        lastRenderT.current = nextT
        setRenderT(nextT)
      }
    }
  })

  if (phase === 'idle') return null

  return (
    <group ref={groupRef}>
      {WAYPOINT_POSITIONS.map((wp) => (
        <WaypointMarker
          key={wp.id}
          waypoint={wp}
          isActive={renderT >= wp.t - 0.01 && renderT <= wp.t + 0.03}
          isPast={renderT > wp.t + 0.03}
        />
      ))}
    </group>
  )
}
