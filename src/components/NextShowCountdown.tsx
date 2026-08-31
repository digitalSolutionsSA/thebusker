import { useCountdown } from '../hooks/useCountdown'
import type { Show } from '../types'

interface Props {
  show: Show
  onBook: (show: Show) => void
}

const formatPrice = (cents: number, currency: string) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(cents / 100)

export default function NextShowCountdown({ show, onBook }: Props) {
  const countdown = useCountdown(show.date)
  const remaining = show.capacity - show.tickets_sold

  return (
    <section className="relative overflow-hidden rounded-2xl border-2 border-brass/40 bg-gradient-to-br from-ink-2 via-ink to-black p-8 sm:p-10 mb-16">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #c9922f 0, #c9922f 2px, transparent 2px, transparent 40px)',
        }}
      />

      <div className="relative grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="uppercase tracking-[0.4em] text-brass-light text-xs mb-3">Up Next</p>
          <h2 className="font-display text-3xl sm:text-4xl text-cream mb-2">{show.title}</h2>
          <p className="text-cream/60 mb-6">
            {new Date(show.date).toLocaleDateString('en-ZA', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}{' '}
            · Doors {show.doors_time} · {formatPrice(show.price_cents, show.currency)} pp
          </p>

          {countdown ? (
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm">
              {[
                { label: 'Days', value: countdown.days },
                { label: 'Hours', value: countdown.hours },
                { label: 'Mins', value: countdown.minutes },
              ].map((c) => (
                <div key={c.label} className="text-center bg-cream/5 rounded-xl py-4 border border-brass/20">
                  <div className="font-headline text-3xl brass-text">{c.value}</div>
                  <div className="text-cream/50 text-xs uppercase tracking-widest">{c.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cream/50 mb-8">Doors are open — see you tonight.</p>
          )}

          <button
            onClick={() => onBook(show)}
            disabled={remaining <= 0}
            className="brass-gradient text-ink font-semibold uppercase tracking-widest text-sm px-8 py-4 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {remaining <= 0 ? 'Sold Out' : 'Book This Show'}
          </button>
        </div>

        <div className="relative h-48 md:h-full rounded-xl bg-gradient-to-br from-brass/10 to-transparent border border-brass/20 flex items-center justify-center overflow-hidden">
          {show.image_url ? (
            <img src={show.image_url} alt={show.title} className="w-full h-full object-cover" />
          ) : (
            <span className="font-headline text-5xl text-brass/25 tracking-widest">
              {show.category === 'bok-town' ? 'BOK TOWN' : 'LIVE'}
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
