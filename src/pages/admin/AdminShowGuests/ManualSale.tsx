import { useMemo, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Show } from '../../../types'
import { createManualBooking, sourceLabels, type BookingSource } from '../../../lib/admin'
import { formatPrice, seatsTotal } from '../../../lib/format'
import { seatsOf, toggleUnit, unitLabel as labelOf } from '../../../lib/seatSelection'
import { floors, type FloorId } from '../../../data/venueLayout'
import { useTakenSeats } from '../../../hooks/useTakenSeats'
import SeatMap from '../../../components/shows/SeatMap'
import { adminInput, adminLabel, btnGold, btnOutline } from '../../../components/admin/ui'

const manualSources: BookingSource[] = ['phone', 'whatsapp', 'pharmacy', 'door', 'other']

/**
 * Record tickets sold outside the website (phone, WhatsApp, Euro Pharmacy, cash at the door).
 * The seats are taken straight away, so the website can't sell them again.
 */
export default function ManualSale({ show, onClose, onSaved }: { show: Show; onClose: () => void; onSaved: () => void }) {
  const { taken, refresh } = useTakenSeats(show.id)
  const [floorId, setFloorId] = useState<FloorId>('downstairs')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState<BookingSource>('phone')
  const [paid, setPaid] = useState(true)
  const [amount, setAmount] = useState<string | null>(null) // null = follow the seat count
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // General admission: a ticket count instead of seats
  const general = show.seating === 'general'
  const [quantity, setQuantity] = useState(1)
  const ticketsLeft = Math.max(0, show.capacity - show.tickets_sold)

  const floor = floors.find((f) => f.id === floorId)!
  const seatIds = useMemo(() => [...selected].flatMap(seatsOf), [selected])
  const count = general ? quantity : seatIds.length
  // Seating-plan shows: each seat at its ticket type price (table / single / upstairs)
  const defaultAmount = ((general ? show.price_cents * count : seatsTotal(show, seatIds)) / 100).toFixed(2)

  const toggle = (id: string) => setSelected((prev) => toggleUnit(prev, id, taken))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!general && seatIds.length === 0) return setError('Tap the seats or table on the plan first.')
    if (general && !(quantity > 0)) return setError('Enter how many tickets.')
    const rands = Number((amount ?? defaultAmount).replace(',', '.'))
    if (!Number.isFinite(rands) || rands < 0) return setError('Enter the amount in rand.')
    setBusy(true)
    setError(null)
    try {
      await createManualBooking({
        showId: show.id,
        seatIds: general ? [] : seatIds,
        quantity: general ? quantity : undefined,
        name,
        phone,
        email,
        source,
        paid,
        amountCents: Math.round(rands * 100),
        notes,
      })
      onSaved()
    } catch (err) {
      const message = (err as Error).message
      setError(message)
      setBusy(false)
      // Someone (online or another staff member) got some of these seats first: start the pick again
      if (message.startsWith('Already booked')) {
        setSelected(new Set())
        refresh()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-night/95 backdrop-blur" role="dialog" aria-modal="true" aria-label="Record a sale">
      <form onSubmit={submit} className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl uppercase tracking-[0.06em]">Record a sale</h2>
            <p className="mt-1 text-sm text-mist">{show.title} · tickets sold by phone, WhatsApp, at the pharmacy or at the door.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 text-mist hover:text-ivory" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={`mt-6 grid gap-6 ${general ? 'max-w-xl' : 'lg:grid-cols-[1.5fr_1fr] lg:items-start'}`}>
          {!general && (
          <div className="min-w-0 rounded-2xl border border-white/10 bg-night-2/80 p-3 sm:p-5">
            <div className="mb-3 flex rounded-full border border-white/10 p-1" role="tablist" aria-label="Floor">
              {floors.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={f.id === floorId}
                  onClick={() => setFloorId(f.id)}
                  className={`flex-1 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] ${f.id === floorId ? 'bg-gold text-night' : 'text-mist'}`}
                >
                  {f.name}
                </button>
              ))}
            </div>
            <div className="-mx-1 overflow-x-auto">
              <div className="w-max min-w-full">
                <SeatMap floor={floor} taken={taken} selected={selected} onToggle={toggle} tableMode={show.table_mode ?? 'whole'} />
              </div>
            </div>
          </div>
          )}

          <div className="space-y-4">
            {general ? (
              <div>
                <span className={adminLabel}>Tickets</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="grid h-12 w-12 place-items-center rounded-xl border border-white/15 text-xl hover:border-gold" aria-label="One fewer ticket">
                    −
                  </button>
                  <input
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0))}
                    className={`${adminInput} w-20 text-center font-display text-xl`}
                    aria-label="Number of tickets"
                  />
                  <button type="button" onClick={() => setQuantity((q) => q + 1)} className="grid h-12 w-12 place-items-center rounded-xl border border-white/15 text-xl hover:border-gold" aria-label="One more ticket">
                    +
                  </button>
                </div>
                <p className="mt-2 text-xs text-mist">About {ticketsLeft} of {show.capacity} tickets left (general admission).</p>
              </div>
            ) : (
              <div>
                <span className={adminLabel}>Seats</span>
                {selected.size === 0 ? (
                  <p className="text-sm text-mist">Tap a table or seats on the plan.</p>
                ) : (
                  <p className="text-sm text-ivory">
                    {[...selected].map(labelOf).join(', ')} · <span className="text-mist">{seatIds.length} seats</span>
                  </p>
                )}
              </div>
            )}
            <div>
              <label htmlFor="ms-name" className={adminLabel}>Buyer's name *</label>
              <input id="ms-name" required value={name} onChange={(e) => setName(e.target.value)} className={adminInput} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div>
                <label htmlFor="ms-phone" className={adminLabel}>Phone</label>
                <input id="ms-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={adminInput} />
              </div>
              <div>
                <label htmlFor="ms-email" className={adminLabel}>Email</label>
                <input id="ms-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={adminInput} />
              </div>
            </div>
            <div>
              <label htmlFor="ms-source" className={adminLabel}>Sold via</label>
              <select id="ms-source" value={source} onChange={(e) => setSource(e.target.value as BookingSource)} className={adminInput}>
                {manualSources.map((s) => (
                  <option key={s} value={s}>
                    {sourceLabels[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: true, label: 'Paid', hint: 'Money received' },
                { value: false, label: 'Reserved', hint: 'Pays at the door' },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setPaid(o.value)}
                  className={`rounded-xl border p-3 text-left ${paid === o.value ? 'border-gold bg-gold/10' : 'border-white/15'}`}
                >
                  <span className="block text-sm font-semibold">{o.label}</span>
                  <span className="block text-xs text-mist">{o.hint}</span>
                </button>
              ))}
            </div>
            <div>
              <label htmlFor="ms-amount" className={adminLabel}>Amount (R)</label>
              <input id="ms-amount" inputMode="decimal" value={amount ?? defaultAmount} onChange={(e) => setAmount(e.target.value)} className={adminInput} />
              <p className="mt-1 text-xs text-mist">
                {general ? `${formatPrice(show.price_cents, show.currency)} per ticket` : 'Worked out from the seat prices'}. Change it for a discount or complimentary tickets.
              </p>
            </div>
            <div>
              <label htmlFor="ms-notes" className={adminLabel}>Notes</label>
              <input id="ms-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={adminInput} placeholder="e.g. EFT reference, birthday table" />
            </div>

            {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className={`${btnOutline} flex-1`}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={`${btnGold} flex-1`}>
                {busy ? 'Saving…' : 'Save sale'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
