import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EARTH_RADIUS } from '@shared/constants/trajectory'

const CAMERA_DISTANCE = EARTH_RADIUS * 3.5   // ~17.5 scene units
const CAMERA_POSITION = [0, EARTH_RADIUS * 0.4, CAMERA_DISTANCE]

export default function SceneCamera() {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(...CAMERA_POSITION)
    camera.fov = 35
    camera.near = 0.01
    camera.far = 200000
    camera.updateProjectionMatrix()
    camera.lookAt(0, 0, 0)
  }, [camera])

  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      minDistance={EARTH_RADIUS * 1.25}
      maxDistance={EARTH_RADIUS * 60}
      target={[0, 0, 0]}
    />
  )
}
