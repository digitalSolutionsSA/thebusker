import { formatPrice } from '../../../lib/format'

interface Props {
  quantity: number
  priceCents: number
  currency: string
}

export default function OrderSummary({ quantity, priceCents, currency }: Props) {
  return (
    <div>
      <h3 className="eyebrow mb-4 text-gold">Order summary</h3>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between text-mist">
          <dt>
            Tickets ({quantity} × {formatPrice(priceCents, currency)})
          </dt>
          <dd className="tabular-nums">{formatPrice(priceCents * quantity, currency)}</dd>
        </div>
        <div className="hairline my-3" />
        <div className="flex items-baseline justify-between">
          <dt className="font-semibold uppercase tracking-widest text-xs">Total</dt>
          <dd className="font-display text-3xl tabular-nums">{formatPrice(priceCents * quantity, currency)}</dd>
        </div>
      </dl>
    </div>
  )
}
