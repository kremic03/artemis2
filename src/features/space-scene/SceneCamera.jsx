import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'
import { useMission } from '@features/mission/MissionContext'
import { KSC_EAST, KSC_NORMAL, KSC_SURFACE } from '@shared/constants/trajectory'

const CAMERA_BASE_POSITION = KSC_SURFACE.clone()
  .addScaledVector(KSC_EAST, -2.4)
  .addScaledVector(KSC_NORMAL, 0.22)
  .add(new Vector3(0, 0, 0.72))
const LAUNCH_LOOK_OFFSET = KSC_NORMAL.clone().multiplyScalar(0.35)
const _rocketPosition = new Vector3()
const _lookTarget = new Vector3()

function alpha(responsiveness, delta) {
  return 1 - Math.exp(-responsiveness * delta)
}

export default function SceneCamera() {
  const { camera } = useThree()
  const { flightRef } = useMission()
  const lookRef = useRef(KSC_SURFACE.clone().add(LAUNCH_LOOK_OFFSET))
  const cameraHeightRef = useRef(CAMERA_BASE_POSITION.y)
  const initialised = useRef(false)

  if (!initialised.current) {
    camera.position.copy(CAMERA_BASE_POSITION)
    camera.fov = 42
    camera.near = 0.001
    camera.far = 200000
    camera.updateProjectionMatrix()
    camera.lookAt(lookRef.current)
    initialised.current = true
  }

  useFrame((_, delta) => {
    const flight = flightRef.current
    if (flight?.position) {
      _rocketPosition.copy(flight.position)
    } else {
      _rocketPosition.copy(KSC_SURFACE)
    }

    const altitude = Math.max(0, _rocketPosition.length() - KSC_SURFACE.length())
    const verticalFollow = MathUtils.clamp(altitude * 0.18, 0, 14)
    cameraHeightRef.current = MathUtils.damp(
      cameraHeightRef.current,
      CAMERA_BASE_POSITION.y + verticalFollow,
      0.8,
      delta
    )

    camera.position.set(
      CAMERA_BASE_POSITION.x,
      cameraHeightRef.current,
      CAMERA_BASE_POSITION.z
    )

    _lookTarget.copy(_rocketPosition).addScaledVector(KSC_NORMAL, 0.35)
    lookRef.current.lerp(_lookTarget, alpha(3.5, delta))
    camera.lookAt(lookRef.current)
  })

  return null
}
