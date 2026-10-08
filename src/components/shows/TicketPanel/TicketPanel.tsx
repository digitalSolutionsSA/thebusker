import { useState, type FormEvent } from 'react'
import { ArrowRight, Lock } from 'lucide-react'
import type { Show } from '../../../types'
import { createCheckoutSession } from '../../../lib/api'
import { formatPrice, ticketsRemaining } from '../../../lib/format'
import Button from '../../ui/Button'
import TicketSelector from '../TicketSelector'
import FormField from '../../ui/FormField'

const MAX_PER_ORDER = 20

/** General admission (no seating plan): choose how many tickets, add contact details, pay on Yoco. */
export default function TicketPanel({ show }: { show: Show }) {
  const bok = show.category === 'bok-town'
  const [remaining, setRemaining] = useState(() => ticketsRemaining(show))
  const max = Math.max(1, Math.min(remaining, MAX_PER_ORDER))
  const soldOut = remaining === 0

  const [quantity, setQuantity] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = formatPrice(show.price_cents * quantity, show.currency)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await createCheckoutSession({ showId: show.id, quantity, name, email, phone })
    if ('url' in result) {
      window.location.href = result.url
      return
    }
    setLoading(false)
    setError(result.error)
    if (typeof result.ticketsLeft === 'number') {
      setRemaining(result.ticketsLeft)
      setQuantity((q) => Math.max(1, Math.min(q, result.ticketsLeft!)))
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass mx-auto max-w-xl space-y-4 rounded-3xl p-5 shadow-[0_40px_120px_-40px_rgb(201_162_74/0.5)] sm:p-7"
    >
      <TicketSelector
        label={bok ? 'Match-day ticket' : 'General admission'}
        priceCents={show.price_cents}
        currency={show.currency}
        quantity={quantity}
        max={max}
        remaining={remaining}
        onChange={(q) => setQuantity(Math.min(Math.max(q, 1), max))}
      />
      {bok && <p className="text-xs leading-relaxed text-mist">Includes a platter, Castle Double Malt &amp; a Springbokkie.</p>}

      <FormField label="Full name" value={name} onChange={setName} autoComplete="name" required />
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
        <FormField label="Phone" type="tel" value={phone} onChange={setPhone} autoComplete="tel" required />
      </div>

      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" variant={bok ? 'bok' : 'primary'} size="lg" fullWidth disabled={loading || soldOut}>
        {soldOut ? 'Sold out' : loading ? 'Securing your tickets…' : `Get tickets · ${total}`}
        {!soldOut && !loading && <ArrowRight size={16} />}
      </Button>
      <p className="flex items-center justify-center gap-2 text-center text-[0.7rem] text-ivory/40">
        <Lock size={12} /> Tickets are held for 15 minutes while you pay securely with Yoco
      </p>
    </form>
  )
}
