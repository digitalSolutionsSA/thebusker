import { useEffect, useRef } from 'react'
import { gsap } from '../../../lib/gsap'

/**
 * Custom cursor: a small gold dot plus a trailing ring that grows over links and turns into a
 * labelled gold disc over anything with data-cursor="Label" (e.g. "View", "Book", "Drag").
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    document.body.classList.add('has-cursor')
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.55, ease: 'power3' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.55, ease: 'power3' })

    const move = (e: PointerEvent) => {
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
      const t = e.target as HTMLElement
      const control = t.closest('a, button, input, textarea, select, label')
      const labelEl = t.closest<HTMLElement>('[data-cursor]')
      // Show the label disc unless the pointer is on a separate control (e.g. a button) inside the labelled area
      const hasLabel = !!labelEl?.dataset.cursor && (!control || control === labelEl || control.contains(labelEl))
      const el = ring.current
      if (!el) return
      el.classList.toggle('is-hot', !!control || hasLabel)
      el.classList.toggle('has-label', hasLabel)
      el.dataset.label = hasLabel ? labelEl!.dataset.cursor! : ''
    }
    const down = () => ring.current?.classList.add('is-down')
    const up = () => ring.current?.classList.remove('is-down')

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.body.classList.remove('has-cursor')
    }
  }, [])

  return (
    <>
      <div ref={dot} className="cursor-dot" aria-hidden />
      <div ref={ring} className="cursor-ring" aria-hidden />
    </>
  )
}
