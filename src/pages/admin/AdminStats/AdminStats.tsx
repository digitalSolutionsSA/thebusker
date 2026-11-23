import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Download, Mail, Phone, Search } from 'lucide-react'
import type { Show, ShowCategory } from '../../../types'
import { referralLabel, sourceLabels, type BookingSource, type BookingStatus } from '../../../lib/admin'
import { bookingRef, formatPrice, formatShortDate } from '../../../lib/format'
import { describeSeats } from '../../../data/venueLayout'
import {
  buildShowStats,
  categoryLabels,
  customersCsv,
  downloadCsv,
  groupCustomers,
  leadBuckets,
  loadStatsData,
  salesCsv,
  showsCsv,
  statusLabels,
  ticketsOf,
  type Customer,
  type ShowStats,
  type StatsBooking,
  type StatsData,
} from '../../../lib/stats'
import { adminCard, adminInput, adminLabel, badge, btnOutline } from '../../../components/admin/ui'
import { ADMIN_BASE } from '../../../config/site'

const todayInSA = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date())

type When = 'past' | 'upcoming' | 'all'
type SortKey = 'date' | 'revenue' | 'tickets' | 'fill'
type View = 'shows' | 'sales' | 'customers'

const allSources = Object.keys(sourceLabels) as BookingSource[]
const allStatuses: BookingStatus[] = ['paid', 'reserved']
type Referral = 'management' | 'other'
const allReferrals: Referral[] = ['management', 'other']
const referralChipLabels: Record<Referral, string> = { management: referralLabel, other: 'Everyone else' }
const referralOf = (b: StatsBooking): Referral => (b.referred_by_management ? 'management' : 'other')
const PAGE = 50

const rand = (cents: number) => formatPrice(cents, 'ZAR').replace(/[.,]00$/, '')
const showLabel = (s: Show) => `${s.title} · ${formatShortDate(s.date)} ${s.date.slice(0, 4)}`

const chip = (on: boolean) =>
  `rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
    on ? 'border-gold/60 bg-gold/15 text-gold' : 'border-white/15 text-mist hover:text-ivory'
  }`

/**
 * Ticket sales and attendance across every show or one show: charts, a sortable show table, every
 * sale (tick sales in or out of the numbers) and every customer with their contact details.
 */
export default function AdminStats() {
  const [data, setData] = useState<StatsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [when, setWhen] = useState<When>('past')
  const [year, setYear] = useState('all')
  const [category, setCategory] = useState<ShowCategory | 'all'>('all')
  const [showId, setShowId] = useState('all')
  const [sources, setSources] = useState<Set<BookingSource>>(() => new Set(allSources))
  const [statuses, setStatuses] = useState<Set<BookingStatus>>(() => new Set(allStatuses))
  const [referrals, setReferrals] = useState<Set<Referral>>(() => new Set(allReferrals))
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set())
  const [view, setView] = useState<View>('shows')
  const [sort, setSort] = useState<SortKey>('date')

  useEffect(() => {
    loadStatsData().then(setData, (e: Error) => setError(e.message))
  }, [])

  const today = todayInSA()
  const showsById = useMemo(() => new Map((data?.shows ?? []).map((s) => [s.id, s])), [data])
  const years = useMemo(() => [...new Set((data?.shows ?? []).map((s) => s.date.slice(0, 4)))].sort().reverse(), [data])

  // Shows matching the date and type filters: these fill the "Show" picker
  const pickable = useMemo(
    () =>
      (data?.shows ?? []).filter((s) => {
        const d = s.date.slice(0, 10)
        if (when === 'past' && d >= today) return false
        if (when === 'upcoming' && d < today) return false
        if (year !== 'all' && !d.startsWith(year)) return false
        if (category !== 'all' && s.category !== category) return false
        return true
      }),
    [data, when, year, category, today],
  )
  // A picked show that the other filters hide no longer applies
  const picked = showId !== 'all' && pickable.some((s) => s.id === showId) ? showId : 'all'
  const shows = useMemo(() => (picked === 'all' ? pickable : pickable.filter((s) => s.id === picked)), [pickable, picked])

  // Sales on those shows that match the channel and payment filters; ticked-out ones are listed but not counted
  const candidate = useMemo(() => {
    const ids = new Set(shows.map((s) => s.id))
    return (data?.bookings ?? []).filter((b) => ids.has(b.show_id) && sources.has(b.source) && statuses.has(b.status) && referrals.has(referralOf(b)))
  }, [data, shows, sources, statuses, referrals])
  const included = useMemo(() => candidate.filter((b) => !excluded.has(b.id)), [candidate, excluded])
  const excludedHere = candidate.length - included.length

  const rows = useMemo(() => {
    const byShow = new Map<string, StatsBooking[]>()
    for (const b of included) byShow.set(b.show_id, [...(byShow.get(b.show_id) ?? []), b])
    return shows.map((s) => buildShowStats(s, byShow.get(s.id) ?? []))
  }, [shows, included])

  if (error) return <p className="text-red-200">{error}</p>
  if (!data) return <p className="text-mist">Adding up the numbers…</p>

  // External shows' sales live on another site, so they'd drag every average down
  const counted = rows.filter((r) => !r.external)
  const external = rows.filter((r) => r.external)
  const sum = (f: (r: ShowStats) => number) => counted.reduce((n, r) => n + f(r), 0)
  const revenue = sum((r) => r.revenueCents)
  const outstanding = sum((r) => r.outstandingCents)
  const tickets = sum((r) => r.tickets)
  const capacity = sum((r) => r.show.capacity)
  const pastCounted = counted.filter((r) => r.show.date.slice(0, 10) < today)
  const pastTickets = pastCounted.reduce((n, r) => n + r.tickets, 0)
  const pastCheckedIn = pastCounted.reduce((n, r) => n + r.checkedIn, 0)
  const single = picked !== 'all' ? showsById.get(picked) : undefined

  const toggle = <T,>(set: Set<T>, value: T, update: (s: Set<T>) => void) => {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    update(next)
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-[0.06em] text-ivory">Sales & stats</h1>
          <p className="mt-1 text-sm text-mist">Ticket sales, takings, attendance and customers for shows sold through this site.</p>
        </div>
      </div>

      {/* Filters */}
      <div className={`${adminCard} mt-6 space-y-4 p-4`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            <span className={adminLabel}>Shows</span>
            <select className={adminInput} value={when} onChange={(e) => setWhen(e.target.value as When)}>
              <option value="past">Past shows</option>
              <option value="upcoming">Upcoming shows</option>
              <option value="all">All shows</option>
            </select>
          </label>
          <label>
            <span className={adminLabel}>Year</span>
            <select className={adminInput} value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="all">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={adminLabel}>Type</span>
            <select className={adminInput} value={category} onChange={(e) => setCategory(e.target.value as ShowCategory | 'all')}>
              <option value="all">All types</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={adminLabel}>Show</span>
            <select className={adminInput} value={picked} onChange={(e) => setShowId(e.target.value)}>
              <option value="all">All {pickable.length} shows</option>
              {pickable.map((s) => (
                <option key={s.id} value={s.id}>
                  {showLabel(s)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`${adminLabel} mb-0 mr-1`}>Sold via</span>
            {allSources.map((s) => (
              <button key={s} type="button" aria-pressed={sources.has(s)} className={chip(sources.has(s))} onClick={() => toggle(sources, s, setSources)}>
                {sourceLabels[s]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`${adminLabel} mb-0 mr-1`}>Payment</span>
            {allStatuses.map((s) => (
              <button key={s} type="button" aria-pressed={statuses.has(s)} className={chip(statuses.has(s))} onClick={() => toggle(statuses, s, setStatuses)}>
                {statusLabels[s]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`${adminLabel} mb-0 mr-1`}>Referred</span>
            {allReferrals.map((r) => (
              <button key={r} type="button" aria-pressed={referrals.has(r)} className={chip(referrals.has(r))} onClick={() => toggle(referrals, r, setReferrals)}>
                {referralChipLabels[r]}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-mist">
          Just the website on its own: leave only <span className="text-ivory">Website</span> on under Sold via and turn off{' '}
          <span className="text-ivory">{referralLabel}</span>.
        </p>
        {excludedHere > 0 && (
          <p className="flex flex-wrap items-center gap-3 rounded-xl bg-gold/10 px-3 py-2 text-xs text-gold">
            {excludedHere} sale{excludedHere === 1 ? ' is' : 's are'} ticked out and not counted in these numbers.
            <button type="button" className="font-semibold underline underline-offset-2" onClick={() => setExcluded(new Set())}>
              Count them all again
            </button>
          </p>
        )}
      </div>

      {single && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-2xl uppercase leading-tight text-ivory">{single.title}</p>
            <p className="text-xs text-mist">
              {formatShortDate(single.date)} {single.date.slice(0, 4)} · doors {single.doors_time} · {categoryLabels[single.category]}
            </p>
          </div>
          <Link to={`${ADMIN_BASE}/shows/${single.id}/guests`} className={btnOutline}>
            Guest list
          </Link>
        </div>
      )}

      {counted.length === 0 ? (
        <p className="mt-8 text-mist">No shows match these filters.</p>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Paid takings" value={rand(revenue)} note={outstanding ? `+ ${rand(outstanding)} not paid yet` : undefined} />
            <Stat
              label="Tickets sold"
              value={tickets.toLocaleString('en-ZA')}
              note={single ? `${included.length} booking${included.length === 1 ? '' : 's'}` : `${counted.length} show${counted.length === 1 ? '' : 's'}`}
            />
            {single ? (
              <Stat label="Average per booking" value={included.length ? rand(Math.round(revenue / included.length)) : '—'} note={included.length ? `${(tickets / included.length).toFixed(1)} tickets` : undefined} />
            ) : (
              <Stat label="Average per show" value={rand(Math.round(revenue / counted.length))} note={`${Math.round(tickets / counted.length)} tickets`} />
            )}
            <Stat
              label="Seats filled"
              value={capacity ? `${Math.round((tickets / capacity) * 100)}%` : '—'}
              note={pastTickets ? `${Math.round((pastCheckedIn / pastTickets) * 100)}% checked in at the door` : undefined}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {!single && (
              <Panel title="Takings per month" hint="Paid takings, by month of the show">
                <MonthChart rows={counted} />
              </Panel>
            )}
            <Panel title="Where tickets were sold" hint="Tickets per sales channel">
              <SourceChart rows={counted} />
            </Panel>
            <Panel title="How far ahead people book" hint="Bookings by days before doors open">
              <LeadChart rows={counted} />
            </Panel>
            {!single && (
              <Panel title="Best sellers" hint="Top shows by paid takings">
                <TopShows rows={counted} />
              </Panel>
            )}
          </div>
        </>
      )}

      {/* Tables */}
      <div className="mt-8 flex flex-wrap gap-1 border-b border-white/10">
        {(
          [
            ['shows', `Show by show (${counted.length})`],
            ['sales', `Sales (${candidate.length})`],
            ['customers', 'Customers'],
          ] as [View, string][]
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] ${view === v ? 'border-gold text-gold' : 'border-transparent text-mist hover:text-ivory'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'shows' && <ShowTable rows={counted} sort={sort} setSort={setSort} today={today} />}
      {view === 'sales' && <SalesTable bookings={candidate} excluded={excluded} setExcluded={setExcluded} showsById={showsById} multiShow={!single} today={today} />}
      {view === 'customers' && <CustomerTable bookings={included} showsById={showsById} today={today} />}

      {external.length > 0 && (
        <div className={`${adminCard} mt-6 p-4`}>
          <p className="text-sm text-ivory">Not in these numbers: sold on another site</p>
          <p className="mt-1 text-xs text-mist">Tickets for these shows were sold elsewhere, so their sales are on that site.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {external.map((r) => (
              <li key={r.show.id} className={`${badge} bg-white/10 text-mist normal-case tracking-normal`}>
                {r.show.title} · {formatShortDate(r.show.date)} · {r.show.external_ticket_seller || 'other site'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ---------- Tables ---------- */

const th = 'px-4 py-3 text-left text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-mist'
const td = 'px-4 py-3 align-top'

function TableShell({ toolbar, children }: { toolbar: ReactNode; children: ReactNode }) {
  return (
    <div className={`${adminCard} mt-4 overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">{toolbar}</div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative block w-full sm:w-72">
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${adminInput} py-2 pl-9`} />
    </label>
  )
}

function Contact({ email, phone }: { email: string | null; phone: string | null }) {
  return (
    <div className="space-y-0.5 text-xs">
      {email && (
        <a href={`mailto:${email}`} className="flex items-center gap-1.5 text-ivory/85 hover:text-gold">
          <Mail size={12} className="shrink-0 text-mist" /> {email}
        </a>
      )}
      {phone && (
        <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 text-ivory/85 hover:text-gold">
          <Phone size={12} className="shrink-0 text-mist" /> {phone}
        </a>
      )}
      {!email && !phone && <span className="text-mist">No contact details</span>}
    </div>
  )
}

const matches = (q: string, ...fields: (string | null | undefined)[]) => {
  const needle = q.trim().toLowerCase()
  return !needle || fields.some((f) => f?.toLowerCase().includes(needle))
}

function ShowTable({ rows, sort, setSort, today }: { rows: ShowStats[]; sort: SortKey; setSort: (k: SortKey) => void; today: string }) {
  const sorted = [...rows].sort((a, b) => {
    if (sort === 'revenue') return b.revenueCents - a.revenueCents
    if (sort === 'tickets') return b.tickets - a.tickets
    if (sort === 'fill') return b.fillPct - a.fillPct
    return b.show.date.localeCompare(a.show.date)
  })
  return (
    <TableShell
      toolbar={
        <>
          <div className="flex flex-wrap gap-1">
            {(['date', 'revenue', 'tickets', 'fill'] as SortKey[]).map((k) => (
              <button key={k} type="button" onClick={() => setSort(k)} className={chip(sort === k)}>
                {{ date: 'Date', revenue: 'Takings', tickets: 'Tickets', fill: '% full' }[k]}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => downloadCsv(`busker-shows-${today}.csv`, showsCsv(sorted))} className={btnOutline} disabled={!rows.length}>
            <Download size={14} /> CSV
          </button>
        </>
      }
    >
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr>
            <th className={th}>Show</th>
            <th className={th}>Sold</th>
            <th className={`${th} text-right`}>Paid</th>
            <th className={`${th} text-right`}>Not paid yet</th>
            <th className={`${th} text-right`}>Website / manual</th>
            <th className={`${th} text-right`}>Checked in</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const web = r.bySource.online?.tickets ?? 0
            const isPast = r.show.date.slice(0, 10) < today
            return (
              <tr key={r.show.id} className="border-t border-white/5">
                <td className={td}>
                  <Link to={`${ADMIN_BASE}/shows/${r.show.id}/guests`} className="font-semibold text-ivory hover:text-gold">
                    {r.show.title}
                  </Link>
                  <div className="text-xs text-mist">
                    {formatShortDate(r.show.date)} {r.show.date.slice(0, 4)} · {categoryLabels[r.show.category] ?? r.show.category}
                  </div>
                </td>
                <td className={td}>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${r.fillPct}%` }} />
                    </div>
                    <span className="tabular-nums text-ivory/80">
                      {r.tickets}/{r.show.capacity}
                    </span>
                  </div>
                </td>
                <td className={`${td} text-right tabular-nums text-ivory`}>{rand(r.revenueCents)}</td>
                <td className={`${td} text-right tabular-nums text-mist`}>{r.outstandingCents ? rand(r.outstandingCents) : '—'}</td>
                <td className={`${td} text-right tabular-nums text-ivory/80`}>
                  {web} / {r.tickets - web}
                </td>
                <td className={`${td} text-right tabular-nums text-ivory/80`}>
                  {isPast && r.tickets ? `${r.checkedIn} (${Math.round((r.checkedIn / r.tickets) * 100)}%)` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </TableShell>
  )
}

function SalesTable({
  bookings,
  excluded,
  setExcluded,
  showsById,
  multiShow,
  today,
}: {
  bookings: StatsBooking[]
  excluded: Set<string>
  setExcluded: (s: Set<string>) => void
  showsById: Map<string, Show>
  multiShow: boolean
  today: string
}) {
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const list = bookings.filter((b) => matches(q, b.name, b.email, b.phone, bookingRef(b.id), showsById.get(b.show_id)?.title))
  const shown = list.slice(0, limit)
  const allOn = list.length > 0 && list.every((b) => !excluded.has(b.id))

  const setMany = (ids: string[], include: boolean) => {
    const next = new Set(excluded)
    for (const id of ids) {
      if (include) next.delete(id)
      else next.add(id)
    }
    setExcluded(next)
  }

  return (
    <TableShell
      toolbar={
        <>
          <SearchBox value={q} onChange={(v) => { setQ(v); setLimit(PAGE) }} placeholder="Search name, email, phone, reference…" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-mist">Untick a sale to leave it out of the numbers above.</span>
            <button
              type="button"
              onClick={() => downloadCsv(`busker-sales-${today}.csv`, salesCsv(list.filter((b) => !excluded.has(b.id)), showsById))}
              className={btnOutline}
              disabled={!list.length}
            >
              <Download size={14} /> CSV
            </button>
          </div>
        </>
      }
    >
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr>
            <th className={`${th} w-10`}>
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#e2bd6d]"
                checked={allOn}
                onChange={(e) => setMany(list.map((b) => b.id), e.target.checked)}
                aria-label="Count every sale in this list"
              />
            </th>
            <th className={th}>Customer</th>
            <th className={th}>Contact</th>
            {multiShow && <th className={th}>Show</th>}
            <th className={th}>Tickets</th>
            <th className={`${th} text-right`}>Amount</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((b) => {
            const on = !excluded.has(b.id)
            const show = showsById.get(b.show_id)
            const seats = describeSeats(b.seat_ids ?? [])
            return (
              <tr key={b.id} className={`border-t border-white/5 ${on ? '' : 'opacity-45'}`}>
                <td className={td}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#e2bd6d]"
                    checked={on}
                    onChange={(e) => setMany([b.id], e.target.checked)}
                    aria-label={`Count ${b.name}'s booking`}
                  />
                </td>
                <td className={td}>
                  <p className="font-semibold text-ivory">{b.name}</p>
                  <p className="text-xs text-mist">
                    #{bookingRef(b.id)} · booked {formatShortDate(b.created_at)}
                  </p>
                </td>
                <td className={td}>
                  <Contact email={b.email} phone={b.phone} />
                </td>
                {multiShow && (
                  <td className={`${td} text-xs`}>
                    <p className="text-ivory/85">{show?.title}</p>
                    <p className="text-mist">{show && `${formatShortDate(show.date)} ${show.date.slice(0, 4)}`}</p>
                  </td>
                )}
                <td className={`${td} text-xs`}>
                  <p className="tabular-nums text-ivory">{ticketsOf(b)}</p>
                  {seats.length > 0 && <p className="max-w-[14rem] text-mist">{seats.join(', ')}</p>}
                </td>
                <td className={`${td} text-right tabular-nums text-ivory`}>{rand(b.amount_cents)}</td>
                <td className={`${td} text-xs`}>
                  <span className={`${badge} ${b.status === 'paid' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gold/15 text-gold'}`}>{statusLabels[b.status] ?? b.status}</span>
                  <p className="mt-1 text-mist">
                    {sourceLabels[b.source] ?? b.source}
                    {b.checked_in_at && ' · checked in'}
                  </p>
                  {b.referred_by_management && <p className="mt-0.5 font-semibold text-gold">{referralLabel}</p>}
                </td>
              </tr>
            )
          })}
          {list.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-mist">
                No sales match.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {list.length > limit && (
        <div className="border-t border-white/10 p-3 text-center">
          <button type="button" className={btnOutline} onClick={() => setLimit((n) => n + PAGE * 4)}>
            Show more ({list.length - limit} left)
          </button>
        </div>
      )}
    </TableShell>
  )
}

function CustomerTable({ bookings, showsById, today }: { bookings: StatsBooking[]; showsById: Map<string, Show>; today: string }) {
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [open, setOpen] = useState<string | null>(null)
  const [order, setOrder] = useState<'spend' | 'shows' | 'recent' | 'name'>('spend')

  const customers = useMemo(() => groupCustomers(bookings, showsById), [bookings, showsById])
  const list = customers
    .filter((c) => matches(q, c.name, c.email, c.phone))
    .sort((a, b) => {
      if (order === 'shows') return b.shows - a.shows || b.paidCents - a.paidCents
      if (order === 'recent') return b.lastDate.localeCompare(a.lastDate)
      if (order === 'name') return a.name.localeCompare(b.name)
      return b.paidCents - a.paidCents
    })
  const shown = list.slice(0, limit)
  const repeat = customers.filter((c) => c.shows > 1).length

  return (
    <TableShell
      toolbar={
        <>
          <SearchBox value={q} onChange={(v) => { setQ(v); setLimit(PAGE) }} placeholder="Search name, email, phone…" />
          <div className="flex flex-wrap items-center gap-1">
            {(['spend', 'shows', 'recent', 'name'] as const).map((k) => (
              <button key={k} type="button" onClick={() => setOrder(k)} className={chip(order === k)}>
                {{ spend: 'Top spend', shows: 'Most shows', recent: 'Recent', name: 'A–Z' }[k]}
              </button>
            ))}
            <button type="button" onClick={() => downloadCsv(`busker-customers-${today}.csv`, customersCsv(list))} className={`${btnOutline} ml-1`} disabled={!list.length}>
              <Download size={14} /> CSV
            </button>
          </div>
          <p className="w-full text-xs text-mist">
            {customers.length} customer{customers.length === 1 ? '' : 's'}
            {repeat > 0 && ` · ${repeat} came to more than one show`}. Matched on email, then phone number.
          </p>
        </>
      }
    >
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr>
            <th className={th}>Customer</th>
            <th className={th}>Contact</th>
            <th className={`${th} text-right`}>Shows</th>
            <th className={`${th} text-right`}>Tickets</th>
            <th className={`${th} text-right`}>Paid</th>
            <th className={th}>Last show</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((c: Customer) => {
            const isOpen = open === c.key
            return (
              <CustomerRows key={c.key} customer={c} isOpen={isOpen} onToggle={() => setOpen(isOpen ? null : c.key)} showsById={showsById} />
            )
          })}
          {list.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-mist">
                No customers match.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {list.length > limit && (
        <div className="border-t border-white/10 p-3 text-center">
          <button type="button" className={btnOutline} onClick={() => setLimit((n) => n + PAGE * 4)}>
            Show more ({list.length - limit} left)
          </button>
        </div>
      )}
    </TableShell>
  )
}

function CustomerRows({ customer: c, isOpen, onToggle, showsById }: { customer: Customer; isOpen: boolean; onToggle: () => void; showsById: Map<string, Show> }) {
  return (
    <>
      <tr className="border-t border-white/5">
        <td className={td}>
          <button type="button" onClick={onToggle} className="flex items-center gap-1.5 text-left font-semibold text-ivory hover:text-gold" aria-expanded={isOpen}>
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {c.name}
          </button>
        </td>
        <td className={td}>
          <Contact email={c.email} phone={c.phone} />
        </td>
        <td className={`${td} text-right tabular-nums text-ivory/85`}>{c.shows}</td>
        <td className={`${td} text-right tabular-nums text-ivory/85`}>{c.tickets}</td>
        <td className={`${td} text-right tabular-nums text-ivory`}>{rand(c.paidCents)}</td>
        <td className={`${td} text-xs text-mist`}>{c.lastDate && `${formatShortDate(c.lastDate)} ${c.lastDate.slice(0, 4)}`}</td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={6} className="bg-night/60 px-4 pb-4 pt-1">
            <ul className="divide-y divide-white/5 text-xs">
              {c.bookings.map((b) => {
                const show = showsById.get(b.show_id)
                return (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="text-ivory/85">
                      {show?.title} · <span className="text-mist">{show && `${formatShortDate(show.date)} ${show.date.slice(0, 4)}`}</span>
                    </span>
                    <span className="tabular-nums text-mist">
                      #{bookingRef(b.id)} · {ticketsOf(b)} ticket{ticketsOf(b) === 1 ? '' : 's'} · {rand(b.amount_cents)} · {statusLabels[b.status]} · {sourceLabels[b.source]}
                    </span>
                  </li>
                )
              })}
            </ul>
          </td>
        </tr>
      )}
    </>
  )
}

/* ---------- Charts ---------- */

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={`${adminCard} p-4`}>
      <p className={adminLabel}>{label}</p>
      <p className="font-display text-2xl tabular-nums text-ivory sm:text-3xl">{value}</p>
      {note && <p className="mt-1 text-xs text-mist">{note}</p>}
    </div>
  )
}

function Panel({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className={`${adminCard} p-4`}>
      <h2 className="font-display text-lg uppercase tracking-[0.06em] text-ivory">{title}</h2>
      <p className="mb-4 text-xs text-mist">{hint}</p>
      {children}
    </section>
  )
}

/** Horizontal bar list: label, bar scaled to the biggest value, and the value */
function Bars({ items }: { items: { key: string; label: ReactNode; value: number; display: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  if (items.length === 0) return <p className="text-sm text-mist">Nothing to show yet.</p>
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.key} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-xs sm:grid-cols-[8rem_1fr_auto]">
          <span className="truncate text-ivory/80">{i.label}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gold" style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
          <span className="min-w-[4.5rem] text-right tabular-nums text-ivory">{i.display}</span>
        </li>
      ))}
    </ul>
  )
}

function MonthChart({ rows }: { rows: ShowStats[] }) {
  const months = new Map<string, number>()
  for (const r of rows) {
    const m = r.show.date.slice(0, 7)
    months.set(m, (months.get(m) ?? 0) + r.revenueCents)
  }
  const keys = [...months.keys()].sort()
  const max = Math.max(1, ...months.values())
  if (keys.length === 0) return <p className="text-sm text-mist">Nothing to show yet.</p>
  return (
    <div className="flex h-48 items-end gap-1.5 overflow-x-auto pb-1">
      {keys.map((m) => {
        const v = months.get(m)!
        const label = new Date(`${m}-01T00:00:00`).toLocaleDateString('en-ZA', { month: 'short', year: '2-digit' })
        return (
          <div key={m} className="flex h-full min-w-[2.5rem] flex-1 flex-col items-center justify-end gap-1" title={`${label}: ${rand(v)}`}>
            <span className="text-[0.6rem] tabular-nums text-ivory/70">{v >= 100_000 ? `R${Math.round(v / 100_000)}k` : rand(v)}</span>
            <div className="w-full rounded-t-md bg-gold" style={{ height: `${Math.max(2, (v / max) * 100)}%` }} />
            <span className="text-[0.6rem] uppercase text-mist">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

function SourceChart({ rows }: { rows: ShowStats[] }) {
  const totals = new Map<BookingSource, number>()
  for (const r of rows) for (const [src, v] of Object.entries(r.bySource)) totals.set(src as BookingSource, (totals.get(src as BookingSource) ?? 0) + v!.tickets)
  const all = [...totals.values()].reduce((a, b) => a + b, 0) || 1
  const items = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([src, t]) => ({ key: src, label: sourceLabels[src] ?? src, value: t, display: `${t} · ${Math.round((t / all) * 100)}%` }))
  return <Bars items={items} />
}

function LeadChart({ rows }: { rows: ShowStats[] }) {
  const counts = leadBuckets.map(() => 0)
  for (const r of rows) for (const d of r.leadDays) counts[leadBuckets.findIndex((b) => d <= b.max)]++
  const all = counts.reduce((a, b) => a + b, 0) || 1
  return <Bars items={leadBuckets.map((b, i) => ({ key: b.label, label: b.label, value: counts[i], display: `${counts[i]} · ${Math.round((counts[i] / all) * 100)}%` }))} />
}

function TopShows({ rows }: { rows: ShowStats[] }) {
  const items = [...rows]
    .filter((r) => r.revenueCents > 0)
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 6)
    .map((r) => ({ key: r.show.id, label: r.show.title, value: r.revenueCents, display: rand(r.revenueCents) }))
  return <Bars items={items} />
}
