import { useMission } from '@features/mission/MissionContext'
import { PHASE_LABELS } from '@shared/constants/mission'
import { formatMET } from '@shared/utils/formatters'
import styles from './TelemetryPanel.module.css'

export default function TelemetryPanel() {
  const { phase, elapsed, altitude, velocity } = useMission()

  return (
    <div className={styles.panel}>
      <div className={styles.phaseRow}>
        <span className={styles.dot} />
        <span className={styles.phaseLabel}>{PHASE_LABELS[phase]}</span>
      </div>

      <div className={styles.divider} />

      <Row label="MET"      value={formatMET(Math.floor(elapsed))} unit="" />
      <Row label="ALT"      value={altitude.toLocaleString()}       unit="km" />
      <Row label="VEL"      value={velocity}                         unit="km/s" />
    </div>
  )
}

function Row({ label, value, unit }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>
        {value}
        {unit && <span className={styles.unit}> {unit}</span>}
      </span>
    </div>
  )
}
