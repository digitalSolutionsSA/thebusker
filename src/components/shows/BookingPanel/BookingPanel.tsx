import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, Lock, X } from 'lucide-react'
import type { Show } from '../../../types'
import { createCheckoutSession } from '../../../lib/api'
import { categoryPrice, formatPrice, seatsTotal } from '../../../lib/format'
import { seatsOf, toggleUnit, unitLabel as labelOf } from '../../../lib/seatSelection'
import { floors, tablesById, type FloorId } from '../../../data/venueLayout'
import { useTakenSeats } from '../../../hooks/useTakenSeats'
import { useInView } from '../../../hooks/useInView'
import Button from '../../ui/Button'
import FormField from '../../ui/FormField'
import SeatMap from '../SeatMap'

/** Pick tables / seats on the hall plan, add contact details, then pay on Yoco. */
export default function BookingPanel({ show }: { show: Show }) {
  const bok = show.category === 'bok-town'
  const tableMode = show.table_mode ?? 'whole'
  const { taken, refresh, markTaken } = useTakenSeats(show.id)

  const [floorId, setFloorId] = useState<FloorId>('downstairs')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formRef, formInView] = useInView<HTMLFormElement>('0px')

  const floor = floors.find((f) => f.id === floorId)!
  const seatIds = useMemo(() => [...selected].flatMap(seatsOf), [selected])
  const total = formatPrice(seatsTotal(show, seatIds), show.currency)
  const prices = [
    { label: tableMode === 'whole' ? 'Table seats' : 'Seats at tables', cents: categoryPrice(show, 'table') },
    { label: 'Single seats', cents: categoryPrice(show, 'single') },
    { label: 'Upstairs', cents: categoryPrice(show, 'upstairs') },
  ]
  const onePrice = prices.every((p) => p.cents === prices[0].cents)

  // Someone else got there first: drop those picks and say so
  useEffect(() => {
    const lost = [...selected].filter((id) => seatsOf(id).some((s) => taken.has(s)))
    if (lost.length === 0) return
    setSelected((prev) => new Set([...prev].filter((id) => !lost.includes(id))))
    setError(`Just booked by someone else: ${lost.map(labelOf).join(', ')}. Please choose again.`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taken])

  const toggle = (id: string) => {
    setError(null)
    setSelected((prev) => toggleUnit(prev, id, taken))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (seatIds.length === 0) {
      setError('Tap a table or seat on the plan first.')
      return
    }
    setError(null)
    setLoading(true)
    const result = await createCheckoutSession({ showId: show.id, seatIds, name, email, phone })
    if ('url' in result) {
      window.location.href = result.url
      return
    }
    setLoading(false)
    if (result.takenSeats?.length) markTaken(result.takenSeats)
    else setError(result.error)
    refresh()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
      {/* Plan */}
      <div className="glass min-w-0 rounded-3xl p-3 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex rounded-full border border-white/10 p-1" role="tablist" aria-label="Floor">
            {floors.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={f.id === floorId}
                onClick={() => setFloorId(f.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] transition-colors ${
                  f.id === floorId ? 'bg-gold text-night' : 'text-mist hover:text-ivory'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
          <ul className="flex gap-4 text-[0.7rem] text-mist">
            <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] border border-gold/60 bg-ivory/10" /> Free</li>
            <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] bg-gold" /> Yours</li>
            <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-[3px] border border-white/15 bg-white/[0.03]" /> Booked</li>
          </ul>
        </div>

        <p className="mb-2 px-1 text-xs text-mist">
          {floorId === 'downstairs'
            ? tableMode === 'whole'
              ? 'Tap a table to book the whole table, or tap a single seat along the walls and boxes.'
              : 'Tap the seats you want, at a table or along the walls. Tap a table to take all its free seats.'
            : 'The balcony seats are booked one by one — tap the seats you want.'}
          <span className="sm:hidden"> Swipe sideways to see the whole hall.</span>
        </p>

        <div className="-mx-1 overflow-x-auto">
          <div className={floorId === 'downstairs' ? 'min-w-[640px] sm:min-w-0' : ''}>
            <SeatMap floor={floor} taken={taken} selected={selected} onToggle={toggle} tableMode={tableMode} />
          </div>
        </div>
      </div>

      {/* Order + details */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="glass space-y-4 rounded-3xl p-5 shadow-[0_40px_120px_-40px_rgb(201_162_74/0.5)] sm:p-7 lg:sticky lg:top-28"
      >
        <div>
          <p className="eyebrow mb-3 text-gold">Your seats</p>
          {selected.size === 0 ? (
            <p className="text-sm text-mist">Nothing picked yet — choose on the plan.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {[...selected].map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 py-1 pl-3 pr-2 text-xs text-ivory hover:border-gold"
                    aria-label={`Remove ${labelOf(id)}`}
                  >
                    {labelOf(id)}
                    {tablesById.has(id) && <span className="text-mist">· {seatsOf(id).length} seats</span>}
                    <X size={12} className="text-mist" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {onePrice ? (
            <p className="mt-3 text-xs text-mist">
              {formatPrice(prices[0].cents, show.currency)} per seat
              {seatIds.length > 0 && ` · ${seatIds.length} seat${seatIds.length === 1 ? '' : 's'}`}
            </p>
          ) : (
            <ul className="mt-3 space-y-0.5 text-xs text-mist">
              {prices.map((p) => (
                <li key={p.label} className="flex justify-between gap-4">
                  <span>{p.label}</span>
                  <span className="tabular-nums text-ivory/80">{formatPrice(p.cents, show.currency)} each</span>
                </li>
              ))}
            </ul>
          )}
          {bok && <p className="mt-1 text-xs text-mist">Includes a platter, Castle Double Malt &amp; a Springbokkie.</p>}
        </div>

        <FormField label="Full name" value={name} onChange={setName} autoComplete="name" required />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <FormField label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
          <FormField label="Phone" type="tel" value={phone} onChange={setPhone} autoComplete="tel" required />
        </div>

        {error && (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" variant={bok ? 'bok' : 'primary'} size="lg" fullWidth disabled={loading}>
          {loading ? 'Securing your seats…' : seatIds.length > 0 ? `Secure seats · ${total}` : 'Choose your seats'}
          {!loading && seatIds.length > 0 && <ArrowRight size={16} />}
        </Button>
        <p className="flex items-center justify-center gap-2 text-center text-[0.7rem] text-ivory/40">
          <Lock size={12} /> Seats are held for 15 minutes while you pay securely with Yoco
        </p>
      </form>

      {/* Phones: the form is below a tall plan, so keep the total and a way to it on screen */}
      {seatIds.length > 0 && !formInView && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/30 bg-night/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
            <p className="text-sm text-ivory">
              {seatIds.length} seat{seatIds.length === 1 ? '' : 's'} · <span className="font-semibold">{total}</span>
            </p>
            <Button
              type="button"
              variant={bok ? 'bok' : 'primary'}
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            >
              Continue <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
