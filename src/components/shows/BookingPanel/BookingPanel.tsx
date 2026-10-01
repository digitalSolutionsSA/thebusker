import { useState, type FormEvent } from 'react'
import { ArrowRight, Lock } from 'lucide-react'
import type { Show } from '../../../types'
import { createCheckoutSession } from '../../../lib/api'
import { ticketsRemaining } from '../../../lib/format'
import Button from '../../ui/Button'
import TicketSelector from '../TicketSelector'
import OrderSummary from '../OrderSummary'
import FormField from '../../ui/FormField'

const MAX_PER_ORDER = 10

/** Ticket picker + contact details, handing off to Stripe Checkout. */
export default function BookingPanel({ show }: { show: Show }) {
  const remaining = ticketsRemaining(show)
  const max = Math.min(remaining, MAX_PER_ORDER)
  const bok = show.category === 'bok-town'

  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
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
    <form
      onSubmit={handleSubmit}
      className="glass relative space-y-7 rounded-3xl p-6 sm:p-8 shadow-[0_40px_120px_-40px_rgb(201_162_74/0.5)]"
    >
      <div>
        <h2 className="eyebrow mb-4 text-gold">Select tickets</h2>
        <TicketSelector
          label={bok ? 'Match-day ticket' : 'General admission'}
          priceCents={show.price_cents}
          currency={show.currency}
          quantity={quantity}
          max={Math.max(max, 1)}
          remaining={remaining}
          onChange={(q) => setQuantity(Math.min(Math.max(q, 1), Math.max(max, 1)))}
        />
        {bok && (
          <p className="mt-3 text-xs leading-relaxed text-mist">Includes a platter, Castle Double Malt &amp; a Springbokkie.</p>
        )}
      </div>

      <div>
        <h2 className="eyebrow mb-4 text-gold">Your details</h2>
        <div className="space-y-3">
          <FormField label="Full name" value={name} onChange={setName} autoComplete="name" required />
          <FormField label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" required />
          <FormField label="Phone number" type="tel" value={phone} onChange={setPhone} autoComplete="tel" required />
        </div>
      </div>

      <OrderSummary quantity={quantity} priceCents={show.price_cents} currency={show.currency} />

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-3">
        <Button type="submit" variant={bok ? 'bok' : 'primary'} size="lg" fullWidth disabled={loading || remaining === 0}>
          {remaining === 0 ? 'Sold out' : loading ? 'Opening secure checkout…' : 'Proceed to checkout'}
          {remaining > 0 && !loading && <ArrowRight size={16} />}
        </Button>
        <p className="flex items-center justify-center gap-2 text-[0.7rem] text-ivory/40">
          <Lock size={12} /> Secure checkout powered by Stripe
        </p>
      </div>
    </form>
  )
}
