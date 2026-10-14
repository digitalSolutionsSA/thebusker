import { ExternalLink, Info } from 'lucide-react'
import type { Show } from '../../../types'
import { priceLabel } from '../../../lib/format'
import Button from '../../ui/Button'

/** Shows sold through another ticketing site: a notice and a button that opens their ticket page. */
export default function ExternalTickets({ show }: { show: Show }) {
  const bok = show.category === 'bok-town'
  const seller = show.external_ticket_seller?.trim()

  return (
    <div className="glass mx-auto max-w-xl rounded-3xl p-5 text-center shadow-[0_40px_120px_-40px_rgb(201_162_74/0.5)] sm:p-7">
      <p className="flex items-center justify-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-gold">
        <Info size={14} /> Booked through {seller || 'an external ticket site'}
      </p>
      <p className="mt-4 font-serif text-lg leading-relaxed text-ivory/85">
        Tickets for this show are sold through {seller || 'an external ticketing site'}, not on our website. Please click below to
        buy your tickets.
      </p>
      <p className="mt-2 text-sm text-mist">{priceLabel(show)} per ticket</p>
      <div className="mt-6">
        <Button href={show.external_ticket_url!} external variant={bok ? 'bok' : 'primary'} size="lg" fullWidth>
          Buy tickets{seller ? ` on ${seller}` : ''} <ExternalLink size={16} />
        </Button>
      </div>
      <p className="mt-3 text-[0.7rem] text-ivory/40">Opens in a new tab. Questions about these tickets go to the ticket seller.</p>
    </div>
  )
}
