import { Vector3 } from 'three'

/** All distances are in scene units (1 unit ≈ 1 000 km). */

export const EARTH = {
  RADIUS: 6.371,          // scene units
  POSITION: new Vector3(0, 0, 0),
  ROTATION_SPEED: 0.02,   // radians per second
}

export const MOON = {
  RADIUS: 1.737,
  ORBIT_RADIUS: 384.4,    // scene units (~384 400 km)
  ORBIT_SPEED: 0.001,     // radians per second (≈ 27-day period, time-scaled)
}

export const SUN_DIRECTION = new Vector3(1, 0.15, 0).normalize()
