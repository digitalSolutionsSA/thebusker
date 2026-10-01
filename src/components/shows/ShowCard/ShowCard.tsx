import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { Show } from '../../../types'
import { formatDay, formatMonth, formatPrice, isSellingFast, ticketsRemaining } from '../../../lib/format'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'
import ShowPoster from '../ShowPoster'

interface Props {
  show: Show
}

export default function ShowCard({ show }: Props) {
  const card = useRef<HTMLAnchorElement>(null)
  const soldOut = ticketsRemaining(show) === 0
  const bok = show.category === 'bok-town'
  const hasPoster = Boolean(show.image_url)

  // 3D tilt + poster parallax on hover (GSAP quickTo)
  useGSAP(
    () => {
      const el = card.current
      if (!el || prefersReducedMotion() || !matchMedia('(pointer: fine)').matches) return
      // Stock photos drift inside the frame; real posters stay put so none of their text is cropped
      const poster = el.querySelector('[data-poster]')
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' })
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' })
      const noop = () => {}
      const px = poster ? gsap.quickTo(poster, 'x', { duration: 0.8, ease: 'power3.out' }) : noop
      const py = poster ? gsap.quickTo(poster, 'y', { duration: 0.8, ease: 'power3.out' }) : noop
      gsap.set(el, { transformPerspective: 900 })

      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width - 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5
        rx(-ny * 8)
        ry(nx * 10)
        px(nx * -14)
        py(ny * -14)
      }
      const leave = () => {
        rx(0)
        ry(0)
        px(0)
        py(0)
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerleave', leave)
      return () => {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerleave', leave)
      }
    },
    { scope: card },
  )

  // The outer div is what ScrollReveal animates; GSAP tilts the inner link.
  return (
    <div className="h-full">
      <Link
        ref={card}
        to={`/shows/${show.slug}`}
        className={`glass group relative flex h-full flex-col overflow-hidden rounded-2xl transition-[border-color,box-shadow] duration-500 will-change-transform ${
          bok
            ? 'border-bok-gold/15 hover:border-bok-gold/50 hover:shadow-[0_30px_80px_-30px_rgb(28_138_74/0.7)]'
            : 'hover:border-gold/70 hover:shadow-[0_30px_80px_-30px_rgb(201_162_74/0.7)]'
        }`}
      >
        <div className={`relative overflow-hidden ${hasPoster ? 'aspect-[5/7]' : 'aspect-[4/3]'}`}>
          {hasPoster ? (
            <ShowPoster show={show} className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-[1.03]" />
          ) : (
            <>
              <div data-poster className="absolute -inset-4">
                <ShowPoster show={show} className="h-full w-full transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-105" />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night-3 to-transparent" />
            </>
          )}
          {isSellingFast(show) && (
            <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold-light backdrop-blur">
              Selling fast
            </span>
          )}
          {soldOut && (
            <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ivory/80">
              Sold out
            </span>
          )}
        </div>
  
        <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="text-center leading-none">
              <div className="font-display text-4xl">{formatDay(show.date)}</div>
              <div className={`mt-1 text-[0.65rem] font-bold tracking-[0.3em] ${bok ? 'text-bok-gold' : 'text-ember-light'}`}>
                {formatMonth(show.date)}
              </div>
            </div>
            <div className="min-w-0 border-l border-white/10 pl-4">
              <h3 className="font-display text-lg uppercase leading-tight text-balance">{show.title}</h3>
              <p className="mt-1 text-xs text-mist">
                From {show.doors_time} · {formatPrice(show.price_cents, show.currency)}
              </p>
            </div>
          </div>
  
          <span
            className={`mt-auto inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] transition-colors ${
              soldOut
                ? 'bg-white/5 text-ivory/40'
                : bok
                  ? 'bg-bok-grass text-white group-hover:bg-[#21a057]'
                  : 'bg-[linear-gradient(115deg,#f6e3b0_0%,#d9b45c_35%,#a8842a_70%,#e2bd6d_100%)] text-night group-hover:brightness-110'
            }`}
          >
            {soldOut ? 'Sold out' : bok ? 'Book a table' : 'Get tickets'}
            {!soldOut && <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />}
          </span>
        </div>
      </Link>
    </div>
  )
}
