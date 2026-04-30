import { useFrame } from '@react-three/fiber'
import { useMission } from '@features/mission/MissionContext'

/**
 * AnimationDriver — lives inside <Canvas> so it can use useFrame.
 * Calls mission.tick(delta) every frame.  Renders nothing.
 */
export default function AnimationDriver() {
  const { tick } = useMission()
  useFrame((_, delta) => tick(delta))
  return null
}
