import { useMission } from '@features/mission/MissionContext'
import { MISSION_PHASES } from '@shared/constants/mission'
import styles from './Controls.module.css'

const SPEEDS = ['slow', 'normal', 'fast']

export default function Controls() {
  const {
    phase, isPlaying,
    play, pause, reset,
    speedKey, setSpeed,
  } = useMission()

  const done = phase === MISSION_PHASES.COMPLETE

  return (
    <div className={styles.panel}>
      {/* Playback row */}
      <div className={styles.row}>
        {done ? (
          <button className={`${styles.btn} ${styles.accent}`} onClick={reset}>↺ RESET</button>
        ) : isPlaying ? (
          <button className={`${styles.btn} ${styles.warning}`} onClick={pause}>⏸ PAUSE</button>
        ) : (
          <button className={`${styles.btn} ${styles.accent}`} onClick={play}>▶ RESUME</button>
        )}
        {!done && (
          <button className={`${styles.btn} ${styles.ghost}`} onClick={reset} title="Reset mission">↺</button>
        )}
      </div>

      {/* Speed row */}
      <div className={styles.row}>
        <span className={styles.groupLabel}>SPD</span>
        {SPEEDS.map(k => (
          <button
            key={k}
            className={`${styles.pill} ${speedKey === k ? styles.pillOn : ''}`}
            onClick={() => setSpeed(k)}
          >{k[0].toUpperCase()}</button>
        ))}
      </div>
    </div>
  )
}
