import { useEffect, useRef, useState } from 'react'
import { useMission } from '@features/mission/MissionContext'
import { PHASE_LABELS } from '@shared/constants/mission'
import styles from './PhaseToast.module.css'

export default function PhaseToast() {
  const { phase, storyText } = useMission()
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [text, setText] = useState('')
  const timerRef = useRef(null)
  const exitTimerRef = useRef(null)

  useEffect(() => {
    if (!storyText) return
    setText(storyText)
    setExiting(false)
    setVisible(true)

    clearTimeout(timerRef.current)
    clearTimeout(exitTimerRef.current)

    timerRef.current = setTimeout(() => {
      setExiting(true)
      exitTimerRef.current = setTimeout(() => setVisible(false), 560)
    }, 5600)

    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(exitTimerRef.current)
    }
  }, [storyText])

  if (!visible) return null

  const dismiss = () => {
    setExiting(true)
    setTimeout(() => setVisible(false), 560)
  }

  return (
    <div className={`${styles.toast} ${exiting ? styles.toastExiting : ''}`}>
      <div className={styles.phaseName}>{PHASE_LABELS[phase]}</div>
      <p className={styles.body}>{text}</p>
      <button className={styles.dismiss} onClick={dismiss}>DISMISS</button>
    </div>
  )
}
