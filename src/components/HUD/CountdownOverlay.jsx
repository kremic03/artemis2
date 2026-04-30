import { useMission } from '@features/mission/MissionContext'
import styles from './CountdownOverlay.module.css'

export default function CountdownOverlay() {
  const { countdownValue } = useMission()
  return (
    <div className={styles.root}>
      <div className={styles.label}>T-MINUS</div>
      <div className={styles.number} key={countdownValue}>
        {String(countdownValue).padStart(2, '0')}
      </div>
      <div className={styles.sub}>ALL SYSTEMS GO · ARTEMIS II</div>
    </div>
  )
}
