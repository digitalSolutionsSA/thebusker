import type { Show } from '../types'

interface Props {
  show: Show
  onBook: (show: Show) => void
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })

const formatPrice = (cents: number, currency: string) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(cents / 100)

export default function ShowCard({ show, onBook }: Props) {
  const remaining = show.capacity - show.tickets_sold
  const soldOut = remaining <= 0
  const almostGone = !soldOut && remaining <= show.capacity * 0.15

  return (
    <div className="card-glass rounded-2xl overflow-hidden flex flex-col group hover:border-brass/50 transition-colors">
      <div className="relative h-48 bg-gradient-to-br from-ink-2 to-black flex items-center justify-center overflow-hidden">
        {show.image_url ? (
          <img src={show.image_url} alt={show.title} className="w-full h-full object-cover" />
        ) : (
          <span className="font-headline text-4xl text-brass/30 tracking-widest">
            {show.category === 'bok-town' ? 'BOK TOWN' : 'LIVE'}
          </span>
        )}
        <span className="absolute top-3 left-3 bg-ink/80 text-brass-light text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-brass/30">
          {formatDate(show.date)}
        </span>
        {almostGone && (
          <span className="absolute top-3 right-3 bg-red-900/80 text-red-200 text-xs uppercase tracking-widest px-3 py-1 rounded-full">
            Almost gone
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-display text-xl text-cream mb-1">{show.title}</h3>
        <p className="text-brass-light text-sm uppercase tracking-wider mb-3">{show.artist}</p>
        <p className="text-cream/60 text-sm mb-6 flex-1">{show.description}</p>

        <div className="flex items-center justify-between mb-4 text-sm text-cream/50">
          <span>Doors {show.doors_time}</span>
          <span>{formatPrice(show.price_cents, show.currency)} pp</span>
        </div>

        <button
          disabled={soldOut}
          onClick={() => onBook(show)}
          className={`w-full py-3 rounded-full text-sm font-semibold uppercase tracking-widest transition-opacity ${
            soldOut
              ? 'bg-cream/10 text-cream/40 cursor-not-allowed'
              : 'brass-gradient text-ink hover:opacity-90'
          }`}
        >
          {soldOut ? 'Sold Out' : 'Book Now'}
        </button>
      </div>
    </div>
  )
}
