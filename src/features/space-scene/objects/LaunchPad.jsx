import { useRef } from 'react'
import { KSC_SURFACE, KSC_NORMAL } from '@shared/constants/trajectory'
import { Quaternion, Vector3 } from 'three'

// Align a group so that its +Y axis points along the Earth surface normal at KSC
const _q = new Quaternion()
const _up = new Vector3(0, 1, 0)
_q.setFromUnitVectors(_up, KSC_NORMAL)
const PAD_QUATERNION = _q.clone()

const PAD_POS = KSC_SURFACE.clone()

/**
 * LaunchPad — small visual structure at Kennedy Space Center.
 * Scale is tiny relative to Earth (1 unit ≈ 6 000 km, pad ≈ 0.001 units).
 * The group is rotated so everything stands "up" on the Earth surface.
 */
export default function LaunchPad() {
  const groupRef = useRef()

  return (
    <group
      position={PAD_POS}
      quaternion={PAD_QUATERNION}
    >
      {/* Launch mount platform */}
      <mesh position={[0, 0.002, 0]}>
        <boxGeometry args={[0.025, 0.004, 0.025]} />
        <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Flame trench */}
      <mesh position={[0, 0.0005, 0]}>
        <boxGeometry args={[0.008, 0.002, 0.040]} />
        <meshStandardMaterial color="#333333" metalness={0.2} roughness={0.9} />
      </mesh>

      {/* Fixed Service Structure (tower) */}
      <mesh position={[-0.014, 0.030, 0]}>
        <boxGeometry args={[0.004, 0.060, 0.004]} />
        <meshStandardMaterial color="#8a8a8a" metalness={0.6} roughness={0.5} />
      </mesh>

      {/* Horizontal cross-arms (3 levels) */}
      {[0.020, 0.035, 0.048].map((y, i) => (
        <mesh key={i} position={[-0.007, y, 0]}>
          <boxGeometry args={[0.014, 0.002, 0.002]} />
          <meshStandardMaterial color="#9a9a9a" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* Rotating Service Structure (shortened) */}
      <mesh position={[0.010, 0.022, 0]}>
        <boxGeometry args={[0.003, 0.040, 0.003]} />
        <meshStandardMaterial color="#777777" metalness={0.6} roughness={0.5} />
      </mesh>

      {/* Water deluge system tanks */}
      {[-0.012, 0.012].map((x, i) => (
        <mesh key={i} position={[x, 0.006, -0.012]}>
          <cylinderGeometry args={[0.003, 0.003, 0.012, 8]} />
          <meshStandardMaterial color="#bbbbcc" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Pad flood lights (tiny emissive dots) */}
      {[[-0.015, -0.015], [-0.015, 0.015], [0.015, -0.015], [0.015, 0.015]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.005, z]}>
          <sphereGeometry args={[0.0008, 4, 4]} />
          <meshBasicMaterial color="#ffcc44" />
        </mesh>
      ))}
    </group>
  )
}
