import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import EmberScene from './three/EmberScene'
import { useCountdown } from '../hooks/useCountdown'
import { fetchShows } from '../lib/api'
import type { Show } from '../types'

export default function Hero() {
  const [nextShow, setNextShow] = useState<Show | null>(null)

  useEffect(() => {
    fetchShows().then((shows) => setNextShow(shows[0] ?? null))
  }, [])

  const countdown = useCountdown(nextShow?.date ?? new Date().toISOString())

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-ink">
      <div className="absolute inset-0 bg-gradient-to-b from-ink-2 via-ink to-black" />
      <div className="absolute inset-0 opacity-70">
        <EmberScene />
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(201,146,47,0.18), transparent 60%)',
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-4xl animate-fade-up">
        <p className="uppercase tracking-[0.5em] text-brass-light text-xs mb-6">
          Music Hall &amp; Venue
        </p>
        <h1 className="font-headline text-6xl sm:text-8xl brass-text leading-none mb-6">
          THE BUSKER
        </h1>
        <p className="text-cream/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
          Good food, good drinks, and unforgettable live shows — under one roof. Home of live
          music nights and where V-Town turns into Bok Town on match day.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            to="/shows"
            className="brass-gradient text-ink font-semibold uppercase tracking-widest text-sm px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
          >
            Book Tickets
          </Link>
          <Link
            to="/bok-town"
            className="border border-brass/50 text-cream uppercase tracking-widest text-sm px-8 py-4 rounded-full hover:bg-brass/10 transition-colors"
          >
            Enter Bok Town
          </Link>
        </div>

        {nextShow && countdown && (
          <Link
            to="/shows"
            className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 rounded-2xl border border-brass/30 bg-cream/5 backdrop-blur px-6 py-4 hover:border-brass/60 transition-colors"
          >
            <div className="text-left">
              <p className="text-brass-light text-[10px] uppercase tracking-[0.3em] mb-0.5">Up Next</p>
              <p className="text-cream text-sm font-medium">{nextShow.title}</p>
            </div>
            <div className="flex items-center gap-3">
              {[
                { label: 'D', value: countdown.days },
                { label: 'H', value: countdown.hours },
                { label: 'M', value: countdown.minutes },
              ].map((c) => (
                <div key={c.label} className="text-center bg-ink/60 rounded-lg px-3 py-2 min-w-14">
                  <div className="font-headline text-xl brass-text leading-none">{c.value}</div>
                  <div className="text-cream/50 text-[10px] uppercase tracking-widest">{c.label}</div>
                </div>
              ))}
            </div>
          </Link>
        )}
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/40 text-xs uppercase tracking-widest animate-bounce">
        Scroll
      </div>
    </section>
  )
}
