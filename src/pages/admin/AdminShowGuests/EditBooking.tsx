import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { bookingRef, manualSources, sourceLabels, updateBooking, type Booking, type BookingSource } from '../../../lib/admin'
import { describeSeats } from '../../../data/venueLayout'
import { adminCard, adminInput, adminLabel, btnGold, btnOutline } from '../../../components/admin/ui'

/**
 * Correct a booking: contact details and notes on any booking; on bookings added by hand also where
 * it was sold, the amount and paid / not paid yet. Seats stay as they are (cancel and rebook to move them).
 */
export default function EditBooking({ booking: b, onClose, onSaved }: { booking: Booking; onClose: () => void; onSaved: () => void }) {
  const online = b.source === 'online'
  const [name, setName] = useState(b.name)
  const [phone, setPhone] = useState(b.phone ?? '')
  const [email, setEmail] = useState(b.email ?? '')
  const [notes, setNotes] = useState(b.notes ?? '')
  const [source, setSource] = useState<BookingSource>(b.source)
  const [paid, setPaid] = useState(b.status === 'paid')
  const [amount, setAmount] = useState((b.amount_cents / 100).toFixed(2))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const rands = Number(amount.replace(',', '.'))
    if (!online && (!Number.isFinite(rands) || rands < 0)) return setError('Enter the amount in rand.')
    setBusy(true)
    setError(null)
    try {
      await updateBooking(b.id, {
        name,
        phone,
        email,
        notes,
        ...(online ? {} : { source, paid, amountCents: Math.round(rands * 100) }),
      })
      onSaved()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-night/95 backdrop-blur" role="dialog" aria-modal="true" aria-label="Edit booking">
      <form onSubmit={submit} className="mx-auto max-w-xl px-4 py-6 sm:px-6">
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

        <div className="mt-6 space-y-4">
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

          {online ? (
            <p className={`${adminCard} px-4 py-3 text-xs text-mist`}>
              Paid online through Yoco, so the amount and payment can't be changed here. To change the seats, cancel the
              booking (refund it in Yoco) and add a new one.
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
                <p className="mt-1 text-xs text-mist">To change the seats, cancel this booking and add a new one.</p>
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
      </form>
    </div>
  )
}
