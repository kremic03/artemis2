import TelemetryPanel from './TelemetryPanel'
import MissionControls from '@components/controls/MissionControls'
import StoryOverlay from '@components/overlay/StoryOverlay'
import WaypointDetail from './WaypointDetail'
import styles from './MissionHUD.module.css'

export default function MissionHUD() {
  return (
    <>
      {/* Top-left: telemetry */}
      <div className={styles.topLeft}>
        <TelemetryPanel />
      </div>

      {/* Top-right: NASA / Artemis branding */}
      <div className={styles.topRight}>
        <div className={styles.brand}>
          <span className={styles.nasa}>NASA</span>
          <span className={styles.artemis}>ARTEMIS II</span>
          <span className={styles.sub}>First Crewed Lunar Flyby Since Apollo</span>
        </div>
      </div>

      {/* Bottom-center: playback + camera controls */}
      <div className={styles.bottomCenter}>
        <MissionControls />
      </div>

      {/* Selected waypoint detail panel */}
      <div className={styles.rightPanel}>
        <WaypointDetail />
      </div>

      {/* Story overlay (center / countdown) */}
      <StoryOverlay />

      {/* Corner scan-line decorations */}
      <div className={`${styles.corner} ${styles.tl}`} />
      <div className={`${styles.corner} ${styles.tr}`} />
      <div className={`${styles.corner} ${styles.bl}`} />
      <div className={`${styles.corner} ${styles.br}`} />
    </>
  )
}
