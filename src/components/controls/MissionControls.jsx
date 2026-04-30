import { useMission } from '@features/mission/MissionContext'
import { MISSION_PHASES } from '@shared/constants/mission'
import styles from './MissionControls.module.css'

const SPEED_OPTIONS = ['slow', 'normal', 'fast']

export default function MissionControls() {
  const {
    phase, isPlaying,
    play, pause, reset,
    speedKey, setSpeed,
  } = useMission()

  const isComplete = phase === MISSION_PHASES.COMPLETE

  return (
    <div className={styles.panel}>
      {/* ── Playback ── */}
      <div className={styles.row}>
        {isComplete ? (
          <button className={`${styles.btn} ${styles.primary}`} onClick={reset}>
            ↺ RESET
          </button>
        ) : isPlaying ? (
          <button className={`${styles.btn} ${styles.warning}`} onClick={pause}>
            ⏸ PAUSE
          </button>
        ) : (
          <button className={`${styles.btn} ${styles.primary}`} onClick={play}>
            {phase === MISSION_PHASES.IDLE ? '⚡ LAUNCH' : '▶ RESUME'}
          </button>
        )}
        {!isComplete && (
          <button className={`${styles.btn} ${styles.ghost}`} onClick={reset}>
            ↺
          </button>
        )}
      </div>

      {/* ── Speed ── */}
      <div className={styles.row}>
        <span className={styles.label}>SPEED</span>
        {SPEED_OPTIONS.map(key => (
          <button
            key={key}
            className={`${styles.pill} ${speedKey === key ? styles.pillActive : ''}`}
            onClick={() => setSpeed(key)}
          >
            {key.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}
