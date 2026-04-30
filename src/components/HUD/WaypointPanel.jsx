import { useMission } from '@features/mission/MissionContext'
import styles from './WaypointPanel.module.css'

export default function WaypointPanel() {
  const { selectedWaypoint, setSelectedWaypoint } = useMission()
  if (!selectedWaypoint) return null

  return (
    <div className={styles.panel}>
      <button className={styles.close} onClick={() => setSelectedWaypoint(null)}>✕</button>
      <div className={styles.id} style={{ color: selectedWaypoint.color }}>
        WAYPOINT {selectedWaypoint.id}
      </div>
      <div className={styles.name}>{selectedWaypoint.label}</div>
      <div className={styles.divider} style={{ borderColor: selectedWaypoint.color + '44' }} />
      <p className={styles.desc}>{selectedWaypoint.shortDesc}</p>
    </div>
  )
}
