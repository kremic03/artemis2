import { useMission } from '@features/mission/MissionContext'
import { formatDistance, formatMET, formatVelocity } from '@shared/utils/formatters'
import styles from './Telemetry.module.css'

export default function Telemetry() {
  const { elapsed, altitude, velocity } = useMission()

  return (
    <div className={styles.panel}>
      <Row label="MET" value={formatMET(Math.floor(elapsed))} />
      <Row label="ALT" value={formatDistance(altitude)} />
      <Row label="VEL" value={formatVelocity(velocity)} />
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  )
}
