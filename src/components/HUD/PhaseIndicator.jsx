import styles from './PhaseIndicator.module.css'

export default function PhaseIndicator({ label }) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.badge}>ARTEMIS II</span>
      <span className={styles.phase}>{label}</span>
    </div>
  )
}
