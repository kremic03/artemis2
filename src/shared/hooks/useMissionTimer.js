import { useEffect, useRef } from 'react'
import { useMission } from '@features/mission/MissionContext'
import { MISSION_PHASES } from '@shared/constants/mission'

/**
 * useMissionTimer — increments telemetry.elapsed every second while the
 * mission is active (not IDLE or SPLASHDOWN).
 */
export function useMissionTimer() {
  const { phase, updateTelemetry } = useMission()
  const intervalRef = useRef(null)

  useEffect(() => {
    const isActive =
      phase !== MISSION_PHASES.IDLE && phase !== MISSION_PHASES.SPLASHDOWN

    if (isActive) {
      intervalRef.current = setInterval(() => {
        updateTelemetry((prev) => ({ elapsed: prev.elapsed + 1 }))
      }, 1000)
    }

    return () => clearInterval(intervalRef.current)
  }, [phase, updateTelemetry])
}
