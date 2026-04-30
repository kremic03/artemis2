import { useEffect, useRef } from 'react'

/**
 * useAnimationLoop — runs a callback on every animation frame.
 * Automatically cleans up on unmount.
 *
 * @param {(deltaMs: number) => void} callback
 * @param {boolean} active — pause the loop when false
 */
export function useAnimationLoop(callback, active = true) {
  const rafRef = useRef(null)
  const lastTimeRef = useRef(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!active) return

    const tick = (time) => {
      const delta = lastTimeRef.current ? time - lastTimeRef.current : 0
      lastTimeRef.current = time
      callbackRef.current(delta)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])
}
