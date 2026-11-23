import { useMemo, useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Show } from '../../../types'
import { bookingRef, changeBookingSeats, manualSources, setBookingReferral, sourceLabels, updateBooking, type Booking, type BookingSource } from '../../../lib/admin'
import { ReferralBox } from './ManualSale'
import { describeSeats, floors, seatsById, type FloorId } from '../../../data/venueLayout'
import { formatPrice, seatsTotal } from '../../../lib/format'
import { toggleUnit } from '../../../lib/seatSelection'
import { useTakenSeats } from '../../../hooks/useTakenSeats'
import SeatMap from '../../../components/shows/SeatMap'
import { adminCard, adminInput, adminLabel, btnGold, btnOutline } from '../../../components/admin/ui'

const sameSeats = (a: string[], b: Set<string>) => a.length === b.size && a.every((s) => b.has(s))

/**
 * Correct a booking: contact details, notes and seats on any booking; on bookings added by hand also
 * where it was sold, the amount and paid / not paid yet.
 */
export default function EditBooking({ show, booking: b, onClose, onSaved }: { show: Show; booking: Booking; onClose: () => void; onSaved: () => void }) {
  const online = b.source === 'online'
  const hasSeats = show.seating !== 'general' && b.seat_ids.length > 0
  const [name, setName] = useState(b.name)
  const [phone, setPhone] = useState(b.phone ?? '')
  const [email, setEmail] = useState(b.email ?? '')
  const [notes, setNotes] = useState(b.notes ?? '')
  const [source, setSource] = useState<BookingSource>(b.source)
  const [paid, setPaid] = useState(b.status === 'paid')
  const [referred, setReferred] = useState(!!b.referred_by_management)
  const [amount, setAmount] = useState((b.amount_cents / 100).toFixed(2))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Seats: picked one by one on the plan; this booking's own seats show as selected, not taken
  const [changingSeats, setChangingSeats] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(() => new Set(b.seat_ids))
  const [floorId, setFloorId] = useState<FloorId>(() => seatsById.get(b.seat_ids[0])?.floor ?? 'downstairs')
  const { taken: allTaken, refresh } = useTakenSeats(show.id)
  const taken = useMemo(() => {
    const own = new Set(b.seat_ids)
    return new Set([...allTaken].filter((s) => !own.has(s)))
  }, [allTaken, b.seat_ids])
  const floor = floors.find((f) => f.id === floorId)!
  const seatIds = useMemo(() => [...selected], [selected])
  const seatsChanged = hasSeats && !sameSeats(b.seat_ids, selected)
  const seatPrice = seatsTotal(show, seatIds)

  const toggle = (id: string) => setSelected((prev) => toggleUnit(prev, id, taken))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const rands = Number(amount.replace(',', '.'))
    if (!online && (!Number.isFinite(rands) || rands < 0)) return setError('Enter the amount in rand.')
    if (hasSeats && selected.size === 0) return setError('Pick at least one seat, or cancel the booking instead.')
    setBusy(true)
    setError(null)
    try {
      if (seatsChanged) await changeBookingSeats(b.id, seatIds)
      await updateBooking(b.id, {
        name,
        phone,
        email,
        notes,
        ...(online ? {} : { source, paid, amountCents: Math.round(rands * 100) }),
      })
      if (referred !== !!b.referred_by_management) await setBookingReferral(b.id, referred)
      onSaved()
    } catch (err) {
      const message = (err as Error).message
      setError(message)
      setBusy(false)
      // Someone got one of the new seats first: show the plan as it is now
      if (message.startsWith('Already booked')) refresh()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-night/95 backdrop-blur" role="dialog" aria-modal="true" aria-label="Edit booking">
      <form onSubmit={submit} className={`mx-auto px-4 py-6 sm:px-6 ${changingSeats ? 'max-w-6xl' : 'max-w-xl'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl uppercase tracking-[0.06em]">Edit booking</h2>
            <p className="mt-1 text-sm text-mist">
              Ref {bookingRef(b.id)} · {b.seat_ids.length > 0 ? describeSeats(b.seat_ids).join(', ') : `${b.quantity} tickets, general admission`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 text-mist hover:text-ivory" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={`mt-6 grid gap-6 ${changingSeats ? 'lg:grid-cols-[1.5fr_1fr] lg:items-start' : ''}`}>
          {changingSeats && (
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
              <p className="mb-3 text-xs text-mist">
                Tap seats to add or remove them. Tap a table top to take (or drop) all its free seats. Gold seats are this booking's.
              </p>
              <div className="-mx-1 overflow-x-auto">
                <div className="w-max min-w-full">
                  <SeatMap floor={floor} taken={taken} selected={selected} onToggle={toggle} tableMode="seats" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {hasSeats && (
              <div>
                <span className={adminLabel}>Seats</span>
                <div className={`${adminCard} px-4 py-3`}>
                  {selected.size === 0 ? (
                    <p className="text-sm text-amber-200">No seats picked.</p>
                  ) : (
                    <p className="text-sm text-ivory">
                      {describeSeats(seatIds).join(', ')} · <span className="text-mist">{selected.size} seats</span>
                    </p>
                  )}
                  {seatsChanged && (
                    <p className="mt-1 text-xs text-mist">
                      Was: {describeSeats(b.seat_ids).join(', ')} ({b.seat_ids.length} seats)
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs">
                    {!changingSeats ? (
                      <button type="button" onClick={() => setChangingSeats(true)} className="font-semibold text-gold hover:text-gold-light">
                        Change seats
                      </button>
                    ) : (
                      seatsChanged && (
                        <button type="button" onClick={() => setSelected(new Set(b.seat_ids))} className="text-mist hover:text-ivory">
                          Undo seat changes
                        </button>
                      )
                    )}
                  </div>
                </div>
                {seatsChanged && selected.size !== b.seat_ids.length && (
                  <p className="mt-1 text-xs text-amber-200">
                    {selected.size > b.seat_ids.length
                      ? `${selected.size - b.seat_ids.length} more seat(s) than before.`
                      : `${b.seat_ids.length - selected.size} fewer seat(s) than before.`}{' '}
                    Seat prices for the new seats: {formatPrice(seatPrice, show.currency)}.
                    {online && ' The online payment stays as it was: collect or refund the difference yourself.'}
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="eb-name" className={adminLabel}>Guest's name *</label>
              <input id="eb-name" required value={name} onChange={(e) => setName(e.target.value)} className={adminInput} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="eb-phone" className={adminLabel}>Phone</label>
                <input id="eb-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={adminInput} />
              </div>
              <div>
                <label htmlFor="eb-email" className={adminLabel}>Email</label>
                <input id="eb-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={adminInput} />
              </div>
            </div>

            <ReferralBox checked={referred} onChange={setReferred} />

            {online ? (
              <p className={`${adminCard} px-4 py-3 text-xs text-mist`}>
                Paid online through Yoco ({formatPrice(b.amount_cents, b.currency)}), so the amount and payment can't be changed here.
              </p>
            ) : (
              <>
                <div>
                  <label htmlFor="eb-source" className={adminLabel}>Sold via</label>
                  <select id="eb-source" value={source} onChange={(e) => setSource(e.target.value as BookingSource)} className={adminInput}>
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
                    { value: false, label: 'Not paid yet', hint: 'Pays at the door' },
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
                  <label htmlFor="eb-amount" className={adminLabel}>Amount (R)</label>
                  <input id="eb-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={adminInput} />
                  {seatsChanged && (
                    <p className="mt-1 text-xs text-mist">
                      The new seats come to {formatPrice(seatPrice, show.currency)} at this show's prices.{' '}
                      <button type="button" onClick={() => setAmount((seatPrice / 100).toFixed(2))} className="font-semibold text-gold hover:text-gold-light">
                        Use that amount
                      </button>
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <label htmlFor="eb-notes" className={adminLabel}>Notes</label>
              <input id="eb-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={adminInput} placeholder="e.g. EFT reference, birthday table" />
            </div>

            {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className={`${btnOutline} flex-1`}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className={`${btnGold} flex-1`}>
                {busy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
