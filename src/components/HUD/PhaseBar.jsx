import { useMission } from '@features/mission/MissionContext'
import { PHASE_LABELS } from '@shared/constants/mission'
import styles from './PhaseBar.module.css'

export default function PhaseBar() {
  const { phase } = useMission()
  return (
    <div className={styles.bar}>
      <span className={styles.dot} />
      <span className={styles.label}>{PHASE_LABELS[phase]}</span>
    </div>
  )
}
