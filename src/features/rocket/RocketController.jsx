import { useRef } from 'react'
import { useMission } from '@features/mission/MissionContext'
import { useRocketPosition } from './useRocketPosition'
import { MISSION_PHASES } from '@shared/constants/mission'
import RocketModel from './RocketModel'
import RocketTrail from './RocketTrail'
import { ROCKET_VISUAL_CONFIG } from '@shared/constants/scene'

const THRUST_PHASES = new Set([
  MISSION_PHASES.LAUNCH,
  MISSION_PHASES.TLI,
  MISSION_PHASES.REENTRY,
])

export default function RocketController() {
  const motionRef = useRef()
  const visualRef = useRef()
  const { phase } = useMission()

  useRocketPosition(motionRef)

  return (
    <>
      <group ref={motionRef}>
        <group
          ref={visualRef}
          scale={ROCKET_VISUAL_CONFIG.scale}
          position={[0, ROCKET_VISUAL_CONFIG.mountOffset, 0]}
          rotation={ROCKET_VISUAL_CONFIG.modelRotation}
        >
          <RocketModel thrustActive={THRUST_PHASES.has(phase)} />
        </group>
      </group>
      <RocketTrail rocketRef={visualRef} />
    </>
  )
}
