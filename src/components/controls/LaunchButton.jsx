import { useMission } from '@features/mission/MissionContext'
import { MISSION_PHASES, PHASE_LABELS } from '@shared/constants/mission'
import styles from './LaunchButton.module.css'

/**
 * LaunchButton — advances the mission to the next phase.
 * Hidden after splashdown.
 */
export default function LaunchButton() {
  const { phase, advancePhase } = useMission()

  if (phase === MISSION_PHASES.SPLASHDOWN) return null

  const label = phase === MISSION_PHASES.IDLE ? 'LAUNCH' : 'NEXT PHASE'

  return (
    <button className={styles.btn} onClick={advancePhase}>
      {label}
    </button>
  )
}
