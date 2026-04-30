/**
 * MISSION_PHASES — ordered IDs matching PHASE_SEGMENTS in trajectory.js
 */
export const MISSION_PHASES = Object.freeze({
  IDLE:        'idle',
  LAUNCH:      'launch',
  ORBIT:       'orbit',
  PROX_OPS:    'prox_ops',
  TLI:         'tli',
  TRANSIT:     'transit',
  LUNAR_FLYBY: 'lunar_flyby',
  RETURN:      'return',
  REENTRY:     'reentry',
  COMPLETE:    'complete',
})

export const PHASE_ORDER = [
  MISSION_PHASES.IDLE,
  MISSION_PHASES.LAUNCH,
  MISSION_PHASES.ORBIT,
  MISSION_PHASES.PROX_OPS,
  MISSION_PHASES.TLI,
  MISSION_PHASES.TRANSIT,
  MISSION_PHASES.LUNAR_FLYBY,
  MISSION_PHASES.RETURN,
  MISSION_PHASES.REENTRY,
  MISSION_PHASES.COMPLETE,
]

/** t ranges on the trajectory curve that belong to each phase */
export const PHASE_T_RANGES = {
  [MISSION_PHASES.IDLE]:        [0.000, 0.000],
  [MISSION_PHASES.LAUNCH]:      [0.000, 0.080],
  [MISSION_PHASES.ORBIT]:       [0.080, 0.250],
  [MISSION_PHASES.PROX_OPS]:    [0.250, 0.380],
  [MISSION_PHASES.TLI]:         [0.380, 0.500],
  [MISSION_PHASES.TRANSIT]:     [0.500, 0.620],
  [MISSION_PHASES.LUNAR_FLYBY]: [0.620, 0.690],
  [MISSION_PHASES.RETURN]:      [0.690, 0.930],
  [MISSION_PHASES.REENTRY]:     [0.930, 1.000],
  [MISSION_PHASES.COMPLETE]:    [1.000, 1.000],
}

export const PHASE_LABELS = {
  [MISSION_PHASES.IDLE]:        'AWAITING LAUNCH',
  [MISSION_PHASES.LAUNCH]:      'LAUNCH — LIFTOFF',
  [MISSION_PHASES.ORBIT]:       'EARTH ORBIT',
  [MISSION_PHASES.PROX_OPS]:    'PROXIMITY OPERATIONS',
  [MISSION_PHASES.TLI]:         'TRANS-LUNAR INJECTION',
  [MISSION_PHASES.TRANSIT]:     'OUTBOUND TRANSIT',
  [MISSION_PHASES.LUNAR_FLYBY]: 'LUNAR FLYBY',
  [MISSION_PHASES.RETURN]:      'RETURN TRAJECTORY',
  [MISSION_PHASES.REENTRY]:     'EARTH RE-ENTRY',
  [MISSION_PHASES.COMPLETE]:    'MISSION COMPLETE',
}

export const PHASE_DESCRIPTIONS = {
  [MISSION_PHASES.IDLE]:        'Orion spacecraft and SLS ready for launch at Pad 39B.',
  [MISSION_PHASES.LAUNCH]:      'SLS ignites. Solid Rocket Boosters provide 8.8 million lbs of thrust.',
  [MISSION_PHASES.ORBIT]:       '23.5-hour checkout in high Earth orbit. Life support and avionics verified.',
  [MISSION_PHASES.PROX_OPS]:    'Orion separates from ICPS. Crew demonstrates manual proximity operations.',
  [MISSION_PHASES.TLI]:         'Orion\'s main engine fires. Free-return trajectory to the Moon initiated.',
  [MISSION_PHASES.TRANSIT]:     '~4 days of outbound transit. Mid-course corrections as needed.',
  [MISSION_PHASES.LUNAR_FLYBY]: 'Closest approach: 10,427 km from the lunar surface. First crewed lunar flyby since Apollo.',
  [MISSION_PHASES.RETURN]:      'Gravity-assisted free return. ~4 days back to Earth.',
  [MISSION_PHASES.REENTRY]:     'Service Module jettisoned. Orion enters atmosphere at 25,000 mph.',
  [MISSION_PHASES.COMPLETE]:    'Splashdown in the Pacific Ocean. All crew recovered.',
}

/** Mission simulation speed: fraction of the curve traversed per second */
export const SPEED_PRESETS = {
  slow:   0.008,
  normal: 0.018,
  fast:   0.040,
}

/** Returns the phase ID for a given t value [0-1] */
export function getPhaseForT(t) {
  if (t <= 0) return MISSION_PHASES.IDLE
  if (t >= 1) return MISSION_PHASES.COMPLETE
  if (t < 0.080) return MISSION_PHASES.LAUNCH
  if (t < 0.250) return MISSION_PHASES.ORBIT
  if (t < 0.380) return MISSION_PHASES.PROX_OPS
  if (t < 0.500) return MISSION_PHASES.TLI
  if (t < 0.620) return MISSION_PHASES.TRANSIT
  if (t < 0.690) return MISSION_PHASES.LUNAR_FLYBY
  if (t < 0.930) return MISSION_PHASES.RETURN
  return MISSION_PHASES.REENTRY
}
