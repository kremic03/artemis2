/** Format seconds as HH:MM:SS mission elapsed time */
export function formatMET(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

export function formatDistance(km) {
  if (km >= 1000) return `${(km / 1000).toFixed(1)} Mm`
  return `${km.toFixed(0)} km`
}

export function formatVelocity(kms) {
  return `${Number(kms).toFixed(2)} km/s`
}
