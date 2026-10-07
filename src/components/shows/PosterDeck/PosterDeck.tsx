import { useRef, type ReactNode } from 'react'
import type { Show } from '../../../types'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'
import ShowPoster from '../ShowPoster'

interface Props {
  shows: Show[]
  active: number
  onSelect: (index: number) => void
  /** Width classes for the deck (the height follows the poster ratio) */
  sizeClassName?: string
  /** Layer drawn over the front poster (e.g. its details). The pointer tilt is off when one is set. */
  overlay?: ReactNode
}

// How each card sits relative to the front one: 0 = front, 1 = first behind it, …
const slot = (depth: number) => ({
  xPercent: depth * 16,
  yPercent: depth * -2,
  rotate: depth * 5,
  scale: 1 - depth * 0.07,
  opacity: depth > 3 ? 0 : 1 - depth * 0.22,
  filter: `brightness(${1 - depth * 0.25}) saturate(${1 - depth * 0.15})`,
  zIndex: 10 - depth,
})

/** Fanned stack of show posters; the active one sits in front and tilts toward the cursor (GSAP). */
export default function PosterDeck({
  shows,
  active,
  onSelect,
  sizeClassName = 'w-[min(17rem,62vw)] sm:w-[19rem] lg:w-[20rem]',
  overlay,
}: Props) {
  const tilt = !overlay
  const root = useRef<HTMLDivElement>(null)
  const n = shows.length
  const depthOf = (i: number) => (i - active + n) % n

  // Deal the cards into their slots whenever the active show changes
  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-deck-card]', root.current)
      cards.forEach((card, i) => {
        const target = slot(depthOf(i))
        if (prefersReducedMotion()) gsap.set(card, target)
        else gsap.to(card, { ...target, duration: 0.9, ease: 'power3.inOut', overwrite: 'auto' })
      })
    },
    { scope: root, dependencies: [active, n] },
  )

  // Front poster tilts with the pointer and a glare follows it
  useGSAP(
    () => {
      const el = root.current
      if (!el || !tilt || prefersReducedMotion() || !matchMedia('(pointer: fine)').matches) return
      const front = () => el.querySelector<HTMLElement>(`[data-deck-card="${active}"] [data-tilt]`)
      const glare = () => el.querySelector<HTMLElement>(`[data-deck-card="${active}"] [data-glare]`)

      const move = (e: PointerEvent) => {
        const card = front()
        if (!card) return
        const r = card.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width - 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5
        gsap.to(card, { rotationY: nx * 14, rotationX: -ny * 10, duration: 0.6, ease: 'power3.out', transformPerspective: 1000 })
        gsap.to(glare(), { opacity: 0.35, '--gx': `${(nx + 0.5) * 100}%`, '--gy': `${(ny + 0.5) * 100}%`, duration: 0.6 })
      }
      const leave = () => {
        gsap.to(el.querySelectorAll('[data-tilt]'), { rotationY: 0, rotationX: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)' })
        gsap.to(el.querySelectorAll('[data-glare]'), { opacity: 0, duration: 0.6 })
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', leave)
      return () => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerleave', leave)
      }
    },
    { scope: root, dependencies: [active, tilt] },
  )

  return (
    <div ref={root} className={`relative mx-auto ${sizeClassName}`}>
      {/* Spacer keeps the poster ratio; cards are layered absolutely on top of it */}
      <div className="aspect-[5/7]" />
      {shows.map((show, i) => {
        const depth = depthOf(i)
        return (
          <button
            key={show.id}
            type="button"
            data-deck-card={i}
            onClick={() => depth !== 0 && onSelect(i)}
            tabIndex={depth === 0 ? -1 : 0}
            aria-label={depth === 0 ? undefined : `Show ${show.title}`}
            aria-hidden={depth === 0 || undefined}
            className={`absolute inset-0 origin-bottom-left will-change-transform ${depth === 0 ? 'cursor-default' : 'cursor-pointer'}`}
            style={{ zIndex: 10 - depth }}
          >
            <div data-tilt className="relative h-full w-full [transform-style:preserve-3d]">
              <ShowPoster
                show={show}
                priority={depth === 0}
                className="h-full w-full rounded-2xl ring-1 ring-white/15 shadow-[0_40px_90px_-25px_rgb(0_0_0/0.95)]"
              />
              <div
                data-glare
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-0 mix-blend-overlay"
                style={{ background: 'radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgb(255 255 255 / 0.9), transparent 55%)' }}
              />
            </div>
          </button>
        )
      })}
      {overlay && <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl">{overlay}</div>}
    </div>
  )
}
