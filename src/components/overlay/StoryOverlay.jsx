import { useEffect, useRef, useState } from 'react'
import { useMission } from '@features/mission/MissionContext'
import { MISSION_PHASES, PHASE_LABELS } from '@shared/constants/mission'
import styles from './StoryOverlay.module.css'

export default function StoryOverlay() {
  const { phase, storyText, dismissStory, showCountdown, countdownValue } = useMission()
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  // Auto-show storyText for 5 seconds then fade
  useEffect(() => {
    if (!storyText) { setVisible(false); return }
    setVisible(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 6000)
    return () => clearTimeout(timerRef.current)
  }, [storyText])

  if (showCountdown) {
    return (
      <div className={styles.countdownWrapper}>
        <div className={styles.countdownLabel}>T-MINUS</div>
        <div className={styles.countdownNumber}>{countdownValue}</div>
        <div className={styles.countdownSub}>ALL SYSTEMS GO • ARTEMIS II</div>
      </div>
    )
  }

  if (!visible || !storyText) return null

  return (
    <div className={`${styles.storyBox} ${visible ? styles.visible : ''}`}>
      <div className={styles.phaseBadge}>{PHASE_LABELS[phase]}</div>
      <p className={styles.text}>{storyText}</p>
      <button className={styles.dismiss} onClick={() => { setVisible(false); dismissStory() }}>
        DISMISS
      </button>
    </div>
  )
}
