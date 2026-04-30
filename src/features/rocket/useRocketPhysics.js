import { Vector3 } from 'three'
import { MISSION_PHASES } from '@shared/constants/mission'

/**
 * Scene-scale physics hints for telemetry and visual tuning.
 * The authoritative path is spline-driven in useRocketPosition; this helper
 * keeps thrust/gravity/drag values explicit without mutating React refs during render.
 */
const EARTH_GRAVITY = 9.80665
const SEA_LEVEL_DENSITY = 1.225

export function getRocketPhysicsState({ phase, altitudeKm = 0, velocityKmS = 0 }) {
  const altitudeM = Math.max(0, altitudeKm * 1000)
  const speedMS = Math.max(0, velocityKmS * 1000)
  const atmosphere = Math.exp(-altitudeM / 8500)
  const gravity = EARTH_GRAVITY / Math.pow(1 + altitudeKm / 6371, 2)
  const dynamicPressure = 0.5 * SEA_LEVEL_DENSITY * atmosphere * speedMS * speedMS

  let thrust = new Vector3()
  switch (phase) {
    case MISSION_PHASES.LAUNCH:
      thrust = new Vector3(0, 1, 0).multiplyScalar(1)
      break
    case MISSION_PHASES.TLI:
      thrust = new Vector3(0, 1, 0).multiplyScalar(0.36)
      break
    case MISSION_PHASES.REENTRY:
      thrust = new Vector3(0, -1, 0).multiplyScalar(0.08)
      break
    default:
      break
  }

  return {
    thrust,
    gravity,
    dynamicPressure,
    dragFactor: Math.min(1, dynamicPressure / 45000),
  }
}

export function useRocketPhysics(phase, telemetry = {}) {
  return getRocketPhysicsState({ phase, ...telemetry })
}
