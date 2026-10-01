import { Minus, Plus } from 'lucide-react'
import { formatPrice } from '../../../lib/format'

interface Props {
  label: string
  priceCents: number
  currency: string
  quantity: number
  max: number
  remaining: number
  onChange: (quantity: number) => void
}

export default function TicketSelector({ label, priceCents, currency, quantity, max, remaining, onChange }: Props) {
  const stepBtn =
    'grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-ivory transition-colors hover:border-ember-light hover:bg-ember/20 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-white/10'

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 text-xs text-mist">
          {formatPrice(priceCents, currency)} per person{remaining === 0 && ' · Sold out'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className={stepBtn} onClick={() => onChange(quantity - 1)} disabled={quantity <= 1} aria-label="One fewer ticket">
          <Minus size={14} />
        </button>
        <span className="w-6 text-center font-display text-xl tabular-nums" aria-live="polite">
          {quantity}
        </span>
        <button type="button" className={stepBtn} onClick={() => onChange(quantity + 1)} disabled={quantity >= max} aria-label="One more ticket">
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
