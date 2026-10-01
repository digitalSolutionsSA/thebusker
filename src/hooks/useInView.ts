import { useEffect, useRef, useState } from 'react'

/** True while the element is on screen — used to pause Three.js scenes that scroll away. */
export function useInView<T extends Element>(rootMargin = '100px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin })
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin])

  return [ref, inView] as const
}
