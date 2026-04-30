import React, {
  createContext, useContext, useRef, useState, useCallback,
} from 'react'
import { Vector3 } from 'three'
import {
  MISSION_PHASES, PHASE_LABELS, PHASE_DESCRIPTIONS,
  SPEED_PRESETS, getPhaseForT,
} from '@shared/constants/mission'

const MissionContext = createContext(null)

// Launch sub-phase identifiers for fine-grained visual cues (shake, plume pulse).
export const LAUNCH_SUBPHASES = Object.freeze({
  NONE:     'none',
  IGNITION: 'ignition',
  LIFTOFF:  'liftoff',
  ASCENT:   'ascent',
  SPACE:    'space',
})

export function MissionProvider({ children }) {
  // ── Per-frame refs (read inside useFrame without re-renders) ──
  const tRef         = useRef(0)
  const isPlayingRef = useRef(false)
  const speedRef     = useRef(SPEED_PRESETS.normal)
  const flightRef    = useRef({
    position: new Vector3(),
    velocity: new Vector3(),
    acceleration: new Vector3(),
    forward: new Vector3(0, 1, 0),
    up: new Vector3(0, 0, 1),
    bank: 0,
    speed: 0,
  })

  // Sub-phase + time-in-subphase so plumes can react smoothly.
  const subPhaseRef       = useRef(LAUNCH_SUBPHASES.NONE)
  const subPhaseTimeRef   = useRef(0)
  const ignitionHoldRef   = useRef(0)   // >0 while holding on-pad during ignition

  // ── Reactive state (triggers UI re-render only on meaningful change) ──
  const [phase, setPhase]           = useState(MISSION_PHASES.IDLE)
  const [isPlaying, setIsPlaying]   = useState(false)
  const [speedKey, setSpeedKey]     = useState('normal')
  const [elapsed, setElapsed]       = useState(0)
  const [altitude, setAltitude]     = useState(0)
  const [velocity, setVelocity]     = useState(0)
  const [selectedWaypoint, setSelectedWaypoint] = useState(null)
  const [storyText, setStoryText]   = useState(null)
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownValue, setCountdownValue] = useState(10)
  const [launchSubPhase, setLaunchSubPhase] = useState(LAUNCH_SUBPHASES.NONE)

  const phaseRef = useRef(MISSION_PHASES.IDLE)

  // ── Sync continuous t → discrete phase ──
  const syncPhase = useCallback((newT) => {
    const newPhase = getPhaseForT(newT)
    if (newPhase !== phaseRef.current) {
      phaseRef.current = newPhase
      setPhase(newPhase)
      setStoryText(PHASE_DESCRIPTIONS[newPhase])
    }
  }, [])

  // ── Sub-phase helpers ─────────────────────────────────────────────────────
  const setSubPhase = (sp) => {
    if (subPhaseRef.current === sp) return
    subPhaseRef.current = sp
    subPhaseTimeRef.current = 0
    setLaunchSubPhase(sp)
  }

  // t-based easing so the rocket starts slow, accelerates through ascent,
  // and smoothly decelerates again on final approach. Returns a speed
  // multiplier applied to speedRef for this frame.
  const launchSpeedEasing = (t) => {
    if (t < 0.08) {
      // Ease-in: starts at ~0.3x, climbs to ~1.7x by orbit insertion
      const p = t / 0.08
      return 0.30 + (p * p) * 1.4
    }
    if (t > 0.96) {
      // Ease-out: smoothly decelerate on final approach
      const p = (t - 0.96) / 0.04
      return 1.0 - p * 0.55
    }
    return 1.0
  }

  // ── Frame tick (called by AnimationDriver) ──
  const tick = useCallback((deltaSeconds) => {
    if (!isPlayingRef.current) return

    // Ignition hold: thrust active, rocket on pad, no t advancement.
    if (ignitionHoldRef.current > 0) {
      ignitionHoldRef.current -= deltaSeconds
      subPhaseTimeRef.current += deltaSeconds
      setElapsed(e => e + deltaSeconds)
      if (ignitionHoldRef.current <= 0) {
        ignitionHoldRef.current = 0
        setSubPhase(LAUNCH_SUBPHASES.LIFTOFF)
      }
      return
    }

    const prev = tRef.current
    const easedDelta = deltaSeconds * speedRef.current * launchSpeedEasing(prev)
    const next = Math.min(1, prev + easedDelta)
    tRef.current = next
    syncPhase(next)

    // Track per-sub-phase wall time for smooth effects
    subPhaseTimeRef.current += deltaSeconds

    // Drive sub-phase transitions from t
    if (next < 0.008)      setSubPhase(LAUNCH_SUBPHASES.LIFTOFF)
    else if (next < 0.080) setSubPhase(LAUNCH_SUBPHASES.ASCENT)
    else                   setSubPhase(LAUNCH_SUBPHASES.SPACE)

    // Telemetry update (throttled via float precision)
    setElapsed(e => e + deltaSeconds)

    // Altitude simulation
    let simAlt
    if      (next < 0.005) simAlt = 0
    else if (next < 0.08)  simAlt = (next / 0.08) * 400
    else if (next < 0.38)  simAlt = 400
    else if (next < 0.62)  simAlt = 400 + (next - 0.38) / 0.24 * (384400 - 400)
    else if (next < 0.69)  simAlt = 384400 - 10427
    else if (next < 0.93)  simAlt = 384400 - (next - 0.69) / 0.24 * (384400 - 400)
    else                   simAlt = 400 * (1 - (next - 0.93) / 0.07)
    setAltitude(Math.round(Math.max(0, simAlt)))

    // Velocity simulation (km/s)
    let simVel
    if      (next < 0.005) simVel = 0
    else if (next < 0.08)  simVel = (next / 0.08) * 7.8
    else if (next < 0.38)  simVel = 7.8
    else if (next < 0.43)  simVel = 7.8 + (next - 0.38) / 0.05 * 3.2   // TLI burn
    else if (next < 0.62)  simVel = 11.0
    else if (next < 0.69)  simVel = 11.0 + 0.2 * Math.sin((next - 0.62) / 0.07 * Math.PI)
    else if (next < 0.93)  simVel = 10.8
    else                   simVel = 10.8 + (next - 0.93) / 0.07 * 0.4
    setVelocity(simVel.toFixed(2))

    if (next >= 1) {
      isPlayingRef.current = false
      setIsPlaying(false)
      setPhase(MISSION_PHASES.COMPLETE)
      phaseRef.current = MISSION_PHASES.COMPLETE
    }
  }, [syncPhase])

  // ── Controls ──────────────────────────────────────────────────────────────
  const play = useCallback(() => {
    if (tRef.current > 0) {
      isPlayingRef.current = true
      setIsPlaying(true)
      return
    }
    // Full launch sequence with countdown → ignition hold → liftoff
    setShowCountdown(true)
    setCountdownValue(10)
    let count = 10
    const iv = setInterval(() => {
      count--
      setCountdownValue(count)
      if (count <= 0) {
        clearInterval(iv)
        setShowCountdown(false)
        isPlayingRef.current = true
        setIsPlaying(true)
        setPhase(MISSION_PHASES.LAUNCH)
        phaseRef.current = MISSION_PHASES.LAUNCH
        setStoryText(PHASE_DESCRIPTIONS[MISSION_PHASES.LAUNCH])
        // Enter IGNITION: thrust visible, rocket on pad, camera shakes
        ignitionHoldRef.current = 1.35  // seconds
        setSubPhase(LAUNCH_SUBPHASES.IGNITION)
      }
    }, 1000)
  }, [])

  const pause = useCallback(() => {
    isPlayingRef.current = false
    setIsPlaying(false)
  }, [])

  const reset = useCallback(() => {
    isPlayingRef.current = false
    tRef.current = 0
    phaseRef.current = MISSION_PHASES.IDLE
    flightRef.current.velocity.set(0, 0, 0)
    flightRef.current.acceleration.set(0, 0, 0)
    flightRef.current.bank = 0
    flightRef.current.speed = 0
    ignitionHoldRef.current = 0
    subPhaseRef.current = LAUNCH_SUBPHASES.NONE
    subPhaseTimeRef.current = 0
    setIsPlaying(false)
    setPhase(MISSION_PHASES.IDLE)
    setElapsed(0)
    setAltitude(0)
    setVelocity('0.00')
    setStoryText(null)
    setSelectedWaypoint(null)
    setLaunchSubPhase(LAUNCH_SUBPHASES.NONE)
  }, [])

  const setSpeed = useCallback((key) => {
    speedRef.current = SPEED_PRESETS[key] ?? SPEED_PRESETS.normal
    setSpeedKey(key)
  }, [])

  const jumpToWaypoint = useCallback((waypoint) => {
    tRef.current = waypoint.t
    syncPhase(waypoint.t)
    setSelectedWaypoint(waypoint)
    setStoryText(waypoint.shortDesc)
    // Don't auto-play — let user resume
  }, [syncPhase])

  const dismissStory = useCallback(() => setStoryText(null), [])

  return (
    <MissionContext.Provider value={{
      // Refs
      tRef, isPlayingRef, speedRef, flightRef,
      subPhaseRef, subPhaseTimeRef, ignitionHoldRef,
      // State
      phase,
      isPlaying, speedKey,
      elapsed, altitude, velocity,
      selectedWaypoint, setSelectedWaypoint,
      storyText, dismissStory,
      showCountdown, countdownValue,
      launchSubPhase,
      // Actions
      tick, play, pause, reset, setSpeed, jumpToWaypoint,
    }}>
      {children}
    </MissionContext.Provider>
  )
}

export function useMission() {
  const ctx = useContext(MissionContext)
  if (!ctx) throw new Error('useMission must be inside <MissionProvider>')
  return ctx
}
