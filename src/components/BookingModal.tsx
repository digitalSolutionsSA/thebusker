import { useState } from 'react'
import type { Show } from '../types'
import { createCheckoutSession } from '../lib/api'

interface Props {
  show: Show
  onClose: () => void
}

const formatPrice = (cents: number, currency: string) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(cents / 100)

export default function BookingModal({ show, onClose }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remaining = show.capacity - show.tickets_sold
  const total = show.price_cents * quantity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await createCheckoutSession({ showId: show.id, quantity, name, email, phone })

    setLoading(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    window.location.href = result.url
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-ink-2 border border-brass/30 rounded-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cream/50 hover:text-cream"
          aria-label="Close"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>

        <p className="text-brass-light text-xs uppercase tracking-widest mb-1">Book Tickets</p>
        <h2 className="font-display text-2xl text-cream mb-1">{show.title}</h2>
        <p className="text-cream/50 text-sm mb-6">
          {new Date(show.date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })} · Doors {show.doors_time}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-cream/50 mb-2">
              Tickets ({remaining} left)
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full border border-brass/40 text-cream hover:bg-brass/10"
              >
                −
              </button>
              <span className="text-xl text-cream w-8 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(remaining, 10, q + 1))}
                className="w-10 h-10 rounded-full border border-brass/40 text-cream hover:bg-brass/10"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-cream/50 mb-2">Full Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-ink border border-brass/30 rounded-lg px-4 py-3 text-cream placeholder:text-cream/30 focus:outline-none focus:border-brass"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-cream/50 mb-2">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink border border-brass/30 rounded-lg px-4 py-3 text-cream placeholder:text-cream/30 focus:outline-none focus:border-brass"
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-cream/50 mb-2">Phone</label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-ink border border-brass/30 rounded-lg px-4 py-3 text-cream placeholder:text-cream/30 focus:outline-none focus:border-brass"
              placeholder="082 000 0000"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-brass/10">
            <span className="text-cream/60 text-sm">Total</span>
            <span className="text-xl font-display text-brass-light">
              {formatPrice(total, show.currency)}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || remaining <= 0}
            className="w-full brass-gradient text-ink font-semibold uppercase tracking-widest text-sm py-4 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Redirecting to secure checkout…' : 'Continue to Payment'}
          </button>
          <p className="text-cream/30 text-xs text-center">Secure checkout powered by Stripe</p>
        </form>
      </div>
    </div>
  )
}
