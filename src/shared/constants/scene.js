export const CANVAS_CONFIG = {
  camera: { position: [4.6, 2.5, 3.1], fov: 42, near: 0.001, far: 200000 },
  gl: {
    antialias: true,
    alpha: false,
    logarithmicDepthBuffer: true,
    powerPreference: 'high-performance',
  },
  dpr: [1, 1.75],
  background: '#020611',
}

export const STAR_LAYERS = [
  { radius: 1800, depth: 48, count: 3200, factor: 3.4, saturation: 0.12 },
  { radius: 5200, depth: 96, count: 4200, factor: 5.2, saturation: 0.28 },
]

export const PROCEDURAL_TEXTURE_SIZES = {
  earthDiffuse: { width: 1536, height: 768 },
  earthClouds: { width: 1024, height: 512 },
  moon: { width: 768, height: 384 },
}

export const ROCKET_VISUAL_CONFIG = {
  scale: 0.58,
  mountOffset: 0.84,
  modelRotation: [0, 0, 0],
}

export const ROCKET_FLIGHT_TUNING = {
  positionResponsiveness: 14,
  orientationResponsiveness: 8.5,
  lookAheadT: 0.012,
  bankStrength: 0.16,
  bankDamping: 5.5,
  bankClamp: 0.2,
  moonUpBlend: 0.2,
  // Ascent oscillation (subtle "fighting gravity" sway)
  ascentSwayAmp: 0.022,
  ascentSwayFreq: 2.8,
  // Nose-forward tilt driven by acceleration magnitude
  accelPitchGain: 0.010,
  accelPitchClamp: 0.18,
}
