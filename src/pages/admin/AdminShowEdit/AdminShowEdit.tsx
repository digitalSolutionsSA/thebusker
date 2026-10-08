import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react'
import type { ShowCategory } from '../../../types'
import { deleteShow, getShow, saveShow, uploadPoster, type ShowInput } from '../../../lib/admin'
import { adminCard, adminInput, adminLabel, btnDanger, btnGold, btnOutline } from '../../../components/admin/ui'
import { ADMIN_BASE } from '../../../config/site'

const categories: { value: ShowCategory; label: string }[] = [
  { value: 'live-music', label: 'Live music' },
  { value: 'bok-town', label: 'Bok Town (rugby screening)' },
  { value: 'special', label: 'Special event' },
]

const blank: ShowInput = {
  title: '',
  artist: '',
  description: '',
  date: '',
  doors_time: '19:00',
  price_cents: 0,
  category: 'live-music',
  image_url: null,
  is_published: true,
  seating: 'reserved',
  capacity: 0,
  price_table_cents: null,
  price_single_cents: null,
  price_upstairs_cents: null,
  table_mode: 'whole',
}

type Tier = 'table' | 'single' | 'upstairs'

const tiers: { key: Tier; label: string; hint: string }[] = [
  { key: 'table', label: 'Seats at tables', hint: 'Downstairs tables, per seat' },
  { key: 'single', label: 'Single seats', hint: 'Boxes and wall seats downstairs' },
  { key: 'upstairs', label: 'Upstairs balcony', hint: 'All 48 balcony seats' },
]

const tableModes = [
  { value: 'whole' as const, label: 'Whole tables only', hint: 'A table is booked in one go (e.g. 6 seats).' },
  { value: 'seats' as const, label: 'Individual seats', hint: 'Buyers can book single seats at a table.' },
]

const toRands = (cents: number | null | undefined) => (cents == null ? '' : (cents / 100).toFixed(2))
const toCents = (rands: string) => {
  const n = Number(rands.replace(',', '.'))
  return rands.trim() !== '' && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null
}

const seatingOptions = [
  { value: 'reserved' as const, label: 'Seating plan', hint: 'Buyers choose their seats or table on the venue map.' },
  { value: 'general' as const, label: 'General admission', hint: 'No seats: buyers just choose how many tickets (e.g. club nights).' },
]

/** Add a new show, or edit one: details, price, poster and whether it's on the website. */
export default function AdminShowEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)

  const [form, setForm] = useState<ShowInput>(blank)
  const [price, setPrice] = useState('')
  const [tickets, setTickets] = useState('')
  const [tierPrices, setTierPrices] = useState<Record<Tier, string>>({ table: '', single: '', upstairs: '' })
  const [sold, setSold] = useState(0)
  const [loading, setLoading] = useState(editing)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getShow(id).then(
      (s) => {
        setForm({
          title: s.title,
          artist: s.artist,
          description: s.description,
          date: s.date.slice(0, 10),
          doors_time: s.doors_time,
          price_cents: s.price_cents,
          category: s.category,
          image_url: s.image_url,
          is_published: s.is_published !== false,
          seating: s.seating ?? 'reserved',
          capacity: s.capacity,
          price_table_cents: s.price_table_cents ?? null,
          price_single_cents: s.price_single_cents ?? null,
          price_upstairs_cents: s.price_upstairs_cents ?? null,
          table_mode: s.table_mode ?? 'whole',
        })
        setPrice((s.price_cents / 100).toFixed(2))
        setTierPrices({
          table: toRands(s.price_table_cents ?? s.price_cents),
          single: toRands(s.price_single_cents ?? s.price_cents),
          upstairs: toRands(s.price_upstairs_cents ?? s.price_cents),
        })
        if (s.seating === 'general') setTickets(String(s.capacity))
        setSold(s.tickets_sold)
        setLoading(false)
      },
      (e: Error) => {
        setError(e.message)
        setLoading(false)
      },
    )
  }, [id])

  const set = <K extends keyof ShowInput>(key: K, value: ShowInput[K]) => setForm((f) => ({ ...f, [key]: value }))

  const onPoster = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      set('image_url', await uploadPoster(file))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const general = form.seating === 'general'
    const rands = Number(price.replace(',', '.'))
    if (general && (!Number.isFinite(rands) || rands < 0 || price.trim() === '')) return setError('Enter the ticket price in rand, e.g. 150 or 150.00.')
    const tierCents = { table: toCents(tierPrices.table), single: toCents(tierPrices.single), upstairs: toCents(tierPrices.upstairs) }
    if (!general && Object.values(tierCents).some((c) => c === null)) return setError('Enter a price for each ticket type, e.g. 150 or 150.00.')
    const limit = Math.floor(Number(tickets))
    if (form.seating === 'general' && !(limit > 0)) return setError('Enter how many tickets are available.')
    setBusy(true)
    setError(null)
    try {
      await saveShow(
        {
          ...form,
          title: form.title.trim(),
          artist: form.artist.trim() || form.title.trim(),
          price_cents: general ? Math.round(rands * 100) : Math.min(tierCents.table!, tierCents.single!, tierCents.upstairs!),
          price_table_cents: tierCents.table,
          price_single_cents: tierCents.single,
          price_upstairs_cents: tierCents.upstairs,
          capacity: general ? limit : form.capacity,
        },
        id,
      )
      navigate(ADMIN_BASE)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!id || !confirm(`Delete “${form.title}”? This can't be undone.`)) return
    setBusy(true)
    setError(null)
    try {
      await deleteShow(id)
      navigate(ADMIN_BASE)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  if (loading) return <p className="text-mist">Loading…</p>

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl">
      <Link to={ADMIN_BASE} className="inline-flex items-center gap-2 text-xs text-mist hover:text-ivory">
        <ArrowLeft size={14} /> All shows
      </Link>
      <h1 className="mt-3 font-display text-3xl uppercase tracking-[0.06em]">{editing ? 'Edit show' : 'Add a show'}</h1>

      <div className={`${adminCard} mt-6 grid gap-6 p-5 sm:grid-cols-[11rem_1fr] sm:p-7`}>
        {/* Poster */}
        <div>
          <span className={adminLabel}>Poster</span>
          <label className="group relative flex aspect-[5/7] w-40 cursor-pointer sm:w-auto items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-night hover:border-gold">
            {form.image_url ? (
              <img src={form.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 px-3 text-center text-xs text-mist">
                <ImagePlus size={22} /> Upload poster
              </span>
            )}
            {uploading && <span className="absolute inset-0 grid place-items-center bg-night/80 text-xs text-ivory">Uploading…</span>}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => onPoster(e.target.files?.[0])} />
          </label>
          {form.image_url && (
            <button type="button" onClick={() => set('image_url', null)} className="mt-2 text-xs text-mist hover:text-ivory">
              Remove poster
            </button>
          )}
          <p className="mt-2 text-[0.7rem] leading-relaxed text-mist">Portrait image works best. Without one, a stock photo is used.</p>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <Field label="Show title" htmlFor="title">
            <input id="title" required value={form.title} onChange={(e) => set('title', e.target.value)} className={adminInput} placeholder="e.g. Céline Dion by Mirandi" />
          </Field>
          <Field label="Artist / performers" htmlFor="artist">
            <input id="artist" value={form.artist} onChange={(e) => set('artist', e.target.value)} className={adminInput} placeholder="Defaults to the title" />
          </Field>
          <div className={`grid gap-4 ${form.seating === 'general' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <Field label="Date" htmlFor="date">
              <input id="date" type="date" required value={form.date} onChange={(e) => set('date', e.target.value)} className={adminInput} />
            </Field>
            <Field label="Doors / starts" htmlFor="doors">
              <input id="doors" type="time" required value={form.doors_time} onChange={(e) => set('doors_time', e.target.value)} className={adminInput} />
            </Field>
            {form.seating === 'general' && (
              <Field label="Price per ticket (R)" htmlFor="price">
                <input id="price" inputMode="decimal" required value={price} onChange={(e) => setPrice(e.target.value)} className={adminInput} placeholder="150.00" />
              </Field>
            )}
          </div>
          <Field label="Type of show" htmlFor="category">
            <select id="category" value={form.category} onChange={(e) => set('category', e.target.value as ShowCategory)} className={adminInput}>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <div>
            <span className={adminLabel}>Tickets</span>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tickets">
              {seatingOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={form.seating === o.value}
                  disabled={sold > 0 && form.seating !== o.value}
                  onClick={() => set('seating', o.value)}
                  className={`rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    form.seating === o.value ? 'border-gold bg-gold/10' : 'border-white/15 hover:border-white/30'
                  }`}
                >
                  <span className="block text-sm font-semibold">{o.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-mist">{o.hint}</span>
                </button>
              ))}
            </div>
            {sold > 0 && <p className="mt-2 text-xs text-mist">Tickets have been sold, so this can't be switched any more.</p>}
            {form.seating === 'general' && (
              <div className="mt-3 max-w-[14rem]">
                <label htmlFor="tickets" className={adminLabel}>Tickets available</label>
                <input
                  id="tickets"
                  inputMode="numeric"
                  required
                  value={tickets}
                  onChange={(e) => setTickets(e.target.value.replace(/\D/g, ''))}
                  className={adminInput}
                  placeholder="e.g. 250"
                />
                {sold > 0 && <p className="mt-1 text-xs text-mist">{sold} already sold.</p>}
              </div>
            )}
          </div>

          {form.seating === 'reserved' && (
            <>
              <div>
                <span className={adminLabel}>Ticket prices (R per seat)</span>
                <div className="grid gap-3 sm:grid-cols-3">
                  {tiers.map((t) => (
                    <div key={t.key} className="rounded-xl border border-white/10 p-3">
                      <label htmlFor={`price-${t.key}`} className="block text-sm font-semibold">
                        {t.label}
                      </label>
                      <span className="block text-[0.7rem] text-mist">{t.hint}</span>
                      <input
                        id={`price-${t.key}`}
                        inputMode="decimal"
                        required
                        value={tierPrices[t.key]}
                        onChange={(e) => setTierPrices((p) => ({ ...p, [t.key]: e.target.value }))}
                        className={`${adminInput} mt-2`}
                        placeholder="150.00"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-mist">Use the same price for all three if every seat costs the same. The website shows “from” the lowest price.</p>
              </div>

              <div>
                <span className={adminLabel}>Tables</span>
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tables">
                  {tableModes.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={form.table_mode === o.value}
                      onClick={() => set('table_mode', o.value)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        form.table_mode === o.value ? 'border-gold bg-gold/10' : 'border-white/15 hover:border-white/30'
                      }`}
                    >
                      <span className="block text-sm font-semibold">{o.label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-mist">{o.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <Field label="Description" htmlFor="description">
            <textarea id="description" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} className={`${adminInput} resize-y`} placeholder="What guests can expect, times, what's included…" />
          </Field>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 p-4">
            <input type="checkbox" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#e2bd6d]" />
            <span>
              <span className="block text-sm font-semibold">Show on the website</span>
              <span className="block text-xs text-mist">Untick to hide it while you're still setting it up, or to take it off sale.</span>
            </span>
          </label>
        </div>
      </div>

      <p className="mt-4 text-xs text-mist">
        {form.seating === 'general'
          ? 'General admission: no seat map on the website, and the show sells out at the number of tickets above.'
          : form.table_mode === 'whole'
            ? 'Seating plan: the whole venue is for sale. Tables are sold whole, at the table seat price for each seat.'
            : 'Seating plan: the whole venue is for sale, and seats at tables can be bought one by one.'}
      </p>

      {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {editing ? (
          <button type="button" onClick={remove} disabled={busy} className={btnDanger}>
            <Trash2 size={14} /> Delete show
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <Link to={ADMIN_BASE} className={btnOutline}>
            Cancel
          </Link>
          <button type="submit" disabled={busy || uploading} className={btnGold}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add show'}
          </button>
        </div>
      </div>
    </form>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={adminLabel}>
        {label}
      </label>
      {children}
    </div>
  )
}
