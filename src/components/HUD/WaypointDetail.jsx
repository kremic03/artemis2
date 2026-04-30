import { useMission } from '@features/mission/MissionContext'
import styles from './WaypointDetail.module.css'

export default function WaypointDetail() {
  const { selectedWaypoint, setSelectedWaypoint } = useMission()
  if (!selectedWaypoint) return null

  return (
    <div className={styles.panel}>
      <button
        className={styles.close}
        onClick={() => setSelectedWaypoint(null)}
      >✕</button>

      <div className={styles.id} style={{ color: selectedWaypoint.color }}>
        WAYPOINT {selectedWaypoint.id}
      </div>
      <div className={styles.label}>{selectedWaypoint.label}</div>
      <div className={styles.divider} style={{ borderColor: selectedWaypoint.color + '55' }} />
      <p className={styles.desc}>{selectedWaypoint.shortDesc}</p>
    </div>
  )
}
