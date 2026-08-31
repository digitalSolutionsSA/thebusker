import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { Show } from '../types'
import { fetchShows } from '../lib/api'

function useCountdown(target: string) {
  const [remaining, setRemaining] = useState(() => new Date(target).getTime() - Date.now())

  useEffect(() => {
    const id = setInterval(() => setRemaining(new Date(target).getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [target])

  if (remaining <= 0) return null
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((remaining / (1000 * 60)) % 60)
  return { days, hours, minutes }
}

export default function BokTown() {
  const [nextMatch, setNextMatch] = useState<Show | null>(null)

  useEffect(() => {
    fetchShows().then((shows) => {
      const match = shows.find((s) => s.category === 'bok-town') ?? null
      setNextMatch(match)
    })
  }, [])

  const countdown = useCountdown(nextMatch?.date ?? new Date().toISOString())

  return (
    <section
      id="bok-town"
      className="relative py-28 overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #05170d 0%, #0b3d24 55%, #05170d 100%)',
      }}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #ffcc02 0, #ffcc02 2px, transparent 2px, transparent 40px)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="uppercase tracking-[0.5em] text-bok-gold text-xs mb-4">
            Turning V-Town Into
          </p>
          <h2 className="font-headline text-6xl sm:text-7xl text-white mb-6">BOK TOWN</h2>
          <p className="text-white/70 max-w-2xl mx-auto text-lg">
            Every Springbok match, The Busker becomes the loudest green-and-gold room in the
            valley. Big screen, ice-cold Castle, and a platter waiting for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <div className="rounded-2xl border-2 border-bok-gold/40 bg-black/30 p-8 flex flex-col justify-between">
            <div>
              <p className="text-bok-gold uppercase tracking-widest text-xs mb-2">Next Match</p>
              {nextMatch ? (
                <>
                  <h3 className="font-display text-2xl text-white mb-2">{nextMatch.title}</h3>
                  <p className="text-white/60 mb-6">
                    {new Date(nextMatch.date).toLocaleDateString('en-ZA', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    · Kickoff build-up from {nextMatch.doors_time}
                  </p>
                </>
              ) : (
                <p className="text-white/60 mb-6">Watch this space — the next fixture drops soon.</p>
              )}

              {countdown && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: 'Days', value: countdown.days },
                    { label: 'Hours', value: countdown.hours },
                    { label: 'Mins', value: countdown.minutes },
                  ].map((c) => (
                    <div key={c.label} className="text-center bg-white/5 rounded-xl py-4">
                      <div className="font-headline text-3xl text-bok-gold">{c.value}</div>
                      <div className="text-white/50 text-xs uppercase tracking-widest">{c.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/shows"
              className="text-center bg-bok-gold text-bok-green font-bold uppercase tracking-widest text-sm px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
            >
              Reserve Match-Day Seats
            </Link>
          </div>

          <div className="grid grid-rows-3 gap-4">
            {[
              { title: 'HD Big Screen & Sound', body: 'Every scrum, every try, in full clarity on our huge venue screen.' },
              { title: 'Match-Day Platters', body: 'Ticket includes a platter, Castle Double Malt & a Springbokkie.' },
              { title: 'Green & Gold Atmosphere', body: 'Sing the anthem with a room full of fellow supporters.' },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/5 p-6 flex flex-col justify-center"
              >
                <h4 className="text-bok-gold font-semibold uppercase tracking-wider text-sm mb-1">
                  {item.title}
                </h4>
                <p className="text-white/60 text-sm">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
