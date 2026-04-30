import { useMission } from '@features/mission/MissionContext'
import { MISSION_PHASES } from '@shared/constants/mission'
import LaunchScreen from './LaunchScreen'
import Telemetry from './Telemetry'
import PhaseBar from './PhaseBar'
import Controls from './Controls'
import WaypointPanel from './WaypointPanel'
import PhaseToast from './PhaseToast'
import styles from './HUD.module.css'
import { COMPLETE_OVERLAY_CONTENT, HUD_BRAND } from '@shared/constants/ui'

export default function HUD() {
  const { phase } = useMission()
  const isIdle     = phase === MISSION_PHASES.IDLE
  const isComplete = phase === MISSION_PHASES.COMPLETE

  return (
    <div className={styles.root}>
      {/* Pre-launch: intro + inline countdown */}
      {isIdle && <LaunchScreen />}

      {/* In-mission UI */}
      {!isIdle && (
        <>
          <div className={styles.topLeft}>
            <Telemetry />
          </div>

          <div className={styles.topCenter}>
            <PhaseBar />
          </div>

          <div className={styles.topRight}>
            <div className={styles.brand}>
              <span className={styles.brandNasa}>{HUD_BRAND.agency}</span>
              <span className={styles.brandName}>{HUD_BRAND.mission}</span>
            </div>
          </div>

          <div className={styles.bottomCenter}>
            <Controls />
          </div>

          <div className={styles.rightMid}>
            <WaypointPanel />
          </div>

          <PhaseToast />

          {isComplete && (
            <div className={styles.completeOverlay}>
              <div className={styles.completeBox}>
                <div className={styles.completeLabel}>{COMPLETE_OVERLAY_CONTENT.label}</div>
                <div className={styles.completeTitle}>{COMPLETE_OVERLAY_CONTENT.title}</div>
                <p className={styles.completeText}>{COMPLETE_OVERLAY_CONTENT.text}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
