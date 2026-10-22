import { useEffect, useRef, type RefObject } from 'react'

const MIN_DISTANCE = 40 // px the finger must travel sideways
const MAX_SLOPE = 0.75 // vertical / horizontal ratio; above this it reads as a scroll, not a swipe

/**
 * Horizontal swipe on a touch screen: calls `onSwipe(1)` for a swipe to the left (next) and
 * `onSwipe(-1)` for a swipe to the right (previous). Vertical drags are left to the page scroll.
 * Touches that start inside an element matching `ignore` are skipped (e.g. a nested swipeable).
 */
export function useSwipe(
  ref: RefObject<HTMLElement | null>,
  onSwipe: ((dir: 1 | -1) => void) | undefined,
  ignore?: string,
) {
  // Latest callback without re-binding the listeners on every render
  const cb = useRef(onSwipe)
  useEffect(() => {
    cb.current = onSwipe
  })
  const enabled = !!onSwipe

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    let start: { x: number; y: number } | null = null

    const down = (e: TouchEvent) => {
      const target = e.target as Element | null
      start = e.touches.length === 1 && !(ignore && target?.closest(ignore)) ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
    }
    const up = (e: TouchEvent) => {
      if (!start) return
      const t = e.changedTouches[0]
      const dx = t.clientX - start.x
      const dy = t.clientY - start.y
      start = null
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dy) > Math.abs(dx) * MAX_SLOPE) return
      cb.current?.(dx < 0 ? 1 : -1)
    }
    const cancel = () => void (start = null)

    el.addEventListener('touchstart', down, { passive: true })
    el.addEventListener('touchend', up, { passive: true })
    el.addEventListener('touchcancel', cancel, { passive: true })
    return () => {
      el.removeEventListener('touchstart', down)
      el.removeEventListener('touchend', up)
      el.removeEventListener('touchcancel', cancel)
    }
  }, [ref, ignore, enabled])
}
