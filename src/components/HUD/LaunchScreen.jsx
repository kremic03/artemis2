import { useMission } from '@features/mission/MissionContext'
import { HUD_BRAND, LAUNCH_SCREEN_CONTENT } from '@shared/constants/ui'
import styles from './LaunchScreen.module.css'

export default function LaunchScreen() {
  const { play, showCountdown, countdownValue } = useMission()

  return (
    <div className={styles.root}>
      {/* Scanline overlay */}
      <div className={styles.scanlines} />

      <div className={styles.content}>
        {/* Logo area */}
        <div className={styles.badge}>{`${HUD_BRAND.agency} · ${HUD_BRAND.program}`}</div>

        <h1 className={styles.title}>{LAUNCH_SCREEN_CONTENT.title}</h1>
        <p className={`${styles.subtitle} ${showCountdown ? styles.fadeOut : ''}`}>
          {LAUNCH_SCREEN_CONTENT.subtitle}
        </p>

        <div className={styles.divider} />

        {/* Stats row — fades out during countdown */}
        <div className={`${styles.stats} ${showCountdown ? styles.fadeOut : ''}`}>
          {LAUNCH_SCREEN_CONTENT.stats.map((stat) => (
            <Stat key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>

        {/* ── Countdown replaces button area ── */}
        {showCountdown ? (
          <div className={styles.countdownCard}>
            <div className={styles.countdownLabel}>{LAUNCH_SCREEN_CONTENT.countdownLabel}</div>
            <div className={styles.countdownNumber} key={countdownValue}>
              {String(countdownValue).padStart(2, '0')}
            </div>
            <div className={styles.countdownSub}>{LAUNCH_SCREEN_CONTENT.countdownSubtext}</div>
          </div>
        ) : (
          <>
            <button className={styles.launchBtn} onClick={play}>
              <span className={styles.launchBtnInner}>
                <span className={styles.launchIcon}>▶</span>
                {LAUNCH_SCREEN_CONTENT.launchLabel}
              </span>
              <span className={styles.launchGlow} />
            </button>
            <p className={styles.hint}>{LAUNCH_SCREEN_CONTENT.hint}</p>
          </>
        )}
      </div>

      {/* Corner decorations */}
      <span className={`${styles.corner} ${styles.tl}`} />
      <span className={`${styles.corner} ${styles.tr}`} />
      <span className={`${styles.corner} ${styles.bl}`} />
      <span className={`${styles.corner} ${styles.br}`} />
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  )
}
