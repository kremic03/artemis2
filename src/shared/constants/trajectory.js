import { Vector3 } from 'three'

// ─── Scene scale ──────────────────────────────────────────────────────────────
// 1 unit ≈ 6 000 km  (artistic — keeps orbit close enough to look dramatic)
export const EARTH_RADIUS = 5        // scene units
export const MOON_RADIUS  = 1.37     // proportional to Earth
export const MOON_POS     = new Vector3(70, 0, 0)

// ─── Kennedy Space Center surface position ────────────────────────────────────
// Lat 28.5°N, Lon 0° (simplified: facing the default +Z camera)
const KSC_LAT = 28.5 * (Math.PI / 180)

// Surface position: p = normalize(p) * R  →  p is already on the sphere by construction
export const KSC_SURFACE = new Vector3(
  EARTH_RADIUS * Math.cos(KSC_LAT),   //  4.394
  EARTH_RADIUS * Math.sin(KSC_LAT),   //  2.386
  0
)

// Outward normal = normalise(position) — rocket stands perpendicular to this
export const KSC_NORMAL = KSC_SURFACE.clone().normalize()  // (0.879, 0.477, 0)

// "East" direction at KSC (lon = 0): tangential, perpendicular to normal in XZ plane
// d/d(lon) of [cos(lat)cos(lon), sin(lat), -cos(lat)sin(lon)] at lon=0 = (0, 0, -cos(lat))
export const KSC_EAST = new Vector3(0, 0, -Math.cos(KSC_LAT)).normalize()  // (0, 0, -1)

// Helper: surface point offset along normal + optional eastward component
const along = (n, east = 0) =>
  KSC_SURFACE.clone()
    .addScaledVector(KSC_NORMAL, n)
    .addScaledVector(KSC_EAST, east)

// ─── Full Artemis II figure-8 trajectory ─────────────────────────────────────
// Starts at the KSC surface and ends at a Pacific splashdown point.
export const TRAJECTORY_CONTROL_POINTS = [
  // ── LAUNCH & ASCENT ──
  // First three points are STRICTLY along KSC_NORMAL (vertical climb).
  // The CatmullRom tangent at t=0 ≈ direction toward p1, so this ensures
  // the rocket launches perfectly upright from the surface.
  along(0.00, 0.00),   //  0  Launch pad  (on Earth surface, r = EARTH_RADIUS)
  along(0.24, 0.00),   //  1  Vertical ~240 km — still along normal, no east component
  along(0.48, 0.08),   //  2  ~480 km — tiny pitchover east begins
  along(0.70, 0.40),   //  3  SRB jettison — pitchover accelerates

  // ── EARTH ORBIT ──
  new Vector3( 5.22,  3.30, -1.05),   //  4  Orbit insertion (LEO)
  new Vector3( 4.40,  4.30, -1.90),   //  5  Orbit — upper west
  new Vector3( 2.36,  5.47, -1.72),   //  6  Orbit — north
  new Vector3(-0.56,  6.09, -1.01),   //  7  Orbit — NE apex
  new Vector3(-3.54,  5.09,  0.00),   //  8  Orbit — west
  new Vector3(-5.83,  1.98,  0.77),   //  9  Orbit — lower west
  new Vector3(-5.62, -2.42,  0.99),   // 10  Orbit — south-west (perigee raise)
  new Vector3(-2.63, -5.60,  0.44),   // 11  Orbit — south
  new Vector3( 1.79, -5.92, -0.45),   // 12  Orbit — south-east (Prox Ops area)
  new Vector3( 4.60, -3.60, -0.90),   // 13  Orbit — east
  new Vector3( 6.04,  0.11, -1.41),   // 14  Orbit — right (apogee raise)
  new Vector3( 5.10,  2.60, -1.10),   // 15  High Earth orbit — USS burn

  // ── TLI DEPARTURE ──
  new Vector3( 7.20,  3.80, -0.60),   // 16  TLI burn
  new Vector3(12.00,  3.20,  0.00),   // 17  Leaving Earth
  new Vector3(22.00,  1.80,  0.00),   // 18  Outbound transit (early)
  new Vector3(36.00,  0.70,  0.00),   // 19  Outbound transit (mid)
  new Vector3(50.00, -0.40,  0.00),   // 20  Approaching Moon

  // ── LUNAR FLYBY ──
  new Vector3(64.00, -1.80,  0.00),   // 21  Lunar approach
  new Vector3(70.20, -4.20,  0.00),   // 22  Closest approach (10 427 km)
  new Vector3(73.00, -7.50,  0.00),   // 23  Past Moon

  // ── RETURN TRAJECTORY (large loop) ──
  new Vector3(73.00,-13.50,  0.00),   // 24  Return loop begins
  new Vector3(66.00,-20.00,  0.00),   // 25  Return arc
  new Vector3(50.00,-24.00,  0.00),   // 26  Return transit (mid)
  new Vector3(32.00,-21.00,  0.00),   // 27  Return transit
  new Vector3(16.00,-14.00,  0.00),   // 28  Heading home
  new Vector3( 6.50, -8.50,  0.00),   // 29  Near Earth
  new Vector3( 4.20, -5.80,  0.00),   // 30  Entry interface (re-entry corridor)
  new Vector3(-2.00, -4.80,  1.80),   // 31  Pacific splashdown
]

// ─── How many points to sample per segment ────────────────────────────────────
export const CURVE_SAMPLES = 90

// ─── Mission trajectory segments (colored) ───────────────────────────────────
export const PHASE_SEGMENTS = [
  {
    id: 'launch',
    label: 'LAUNCH & ASCENT',
    tStart: 0.000,
    tEnd:   0.080,
    color: '#ff7043',
    glowColor: '#ff3d00',
  },
  {
    id: 'orbit',
    label: 'EARTH ORBIT',
    tStart: 0.080,
    tEnd:   0.380,
    color: '#4fc3f7',
    glowColor: '#0288d1',
  },
  {
    id: 'tli',
    label: 'TRANS-LUNAR INJECTION',
    tStart: 0.380,
    tEnd:   0.500,
    color: '#69f0ae',
    glowColor: '#00c853',
  },
  {
    id: 'transit',
    label: 'OUTBOUND TRANSIT',
    tStart: 0.500,
    tEnd:   0.620,
    color: '#69f0ae',
    glowColor: '#00c853',
  },
  {
    id: 'lunar_flyby',
    label: 'LUNAR FLYBY',
    tStart: 0.620,
    tEnd:   0.690,
    color: '#eeeeee',
    glowColor: '#b0bec5',
  },
  {
    id: 'return',
    label: 'RETURN TRAJECTORY',
    tStart: 0.690,
    tEnd:   0.930,
    color: '#5c6bc0',
    glowColor: '#3949ab',
  },
  {
    id: 'reentry',
    label: 'RE-ENTRY',
    tStart: 0.930,
    tEnd:   1.000,
    color: '#ff7043',
    glowColor: '#bf360c',
  },
]

// ─── Numbered waypoints 1–15 ──────────────────────────────────────────────────
export const WAYPOINTS = [
  { id:  1, t: 0.000, label: 'T+0 LIFTOFF',        phase: 'launch',      color: '#ff7043',
    shortDesc: 'Liftoff from Pad 39B. SLS core and twin solid rocket boosters clear the tower.' },
  { id:  2, t: 0.015, label: 'T+1:10 MAX-Q',       phase: 'launch',      color: '#ff7043',
    shortDesc: 'Maximum dynamic pressure. Throttle and guidance keep loads under control.' },
  { id:  3, t: 0.040, label: 'T+2:12 BECO',        phase: 'launch',      color: '#ff7043',
    shortDesc: 'Booster Engine Cutoff, followed by solid rocket booster separation.' },
  { id:  4, t: 0.080, label: 'T+8:20 MECO',        phase: 'orbit',       color: '#4fc3f7',
    shortDesc: 'Core Stage Main Engine Cutoff and separation. Orion and ICPS coast toward initial orbit.' },
  { id:  5, t: 0.150, label: 'PERIGEE RAISE',      phase: 'orbit',       color: '#4fc3f7',
    shortDesc: 'ICPS perigee raise burn shapes the first Earth orbit checkout path.' },
  { id:  6, t: 0.230, label: 'APOGEE RAISE',       phase: 'orbit',       color: '#4fc3f7',
    shortDesc: 'Second ICPS burn raises apogee for Orion systems checkout.' },
  { id:  7, t: 0.280, label: 'PROX OPS DEMO',      phase: 'prox_ops',    color: '#ffb300',
    shortDesc: 'Orion separates from ICPS and performs manual proximity operations.' },
  { id:  8, t: 0.340, label: 'HIGH EARTH ORBIT',   phase: 'prox_ops',    color: '#4fc3f7',
    shortDesc: 'Crew and ground verify life support, navigation, and propulsion before lunar departure.' },
  { id:  9, t: 0.430, label: 'TLI BURN',           phase: 'tli',         color: '#69f0ae',
    shortDesc: "Orion's service module commits to the translunar free-return trajectory." },
  { id: 10, t: 0.560, label: 'OUTBOUND TRANSIT',   phase: 'transit',     color: '#69f0ae',
    shortDesc: 'Outbound cruise with trajectory correction burns as needed.' },
  { id: 11, t: 0.645, label: 'LUNAR FLYBY',        phase: 'lunar_flyby', color: '#eeeeee',
    shortDesc: 'Free-return lunar flyby, roughly 10,400 km above the lunar surface in this sim.' },
  { id: 12, t: 0.780, label: 'TRANS-EARTH RETURN', phase: 'return',      color: '#5c6bc0',
    shortDesc: 'Lunar gravity bends Orion back toward Earth for the return leg.' },
  { id: 13, t: 0.910, label: 'CM SEPARATION',      phase: 'return',      color: '#5c6bc0',
    shortDesc: 'Crew Module separates from the Service Module before atmospheric entry.' },
  { id: 14, t: 0.955, label: 'ENTRY INTERFACE',    phase: 'reentry',     color: '#ff7043',
    shortDesc: 'Orion enters the atmosphere at lunar-return velocity and peak heating begins.' },
  { id: 15, t: 1.000, label: 'SPLASHDOWN',         phase: 'reentry',     color: '#ff7043',
    shortDesc: 'Pacific splashdown and recovery complete the Artemis II profile.' },
]
