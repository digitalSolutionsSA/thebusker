import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import type { ShowCategory } from '../../../types'
import { sourceLabels, type BookingSource } from '../../../lib/admin'
import { formatPrice, formatShortDate } from '../../../lib/format'
import { categoryLabels, leadBuckets, loadShowStats, toCsv, type ShowStats } from '../../../lib/stats'
import { adminCard, adminInput, adminLabel, badge, btnOutline } from '../../../components/admin/ui'
import { ADMIN_BASE } from '../../../config/site'

const todayInSA = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date())

type When = 'past' | 'upcoming' | 'all'
type SortKey = 'date' | 'revenue' | 'tickets' | 'fill'

const rand = (cents: number) => formatPrice(cents, 'ZAR').replace(/[.,]00$/, '')

/** Ticket sales and attendance across every show, with charts, a sortable table and CSV export. */
export default function AdminStats() {
  const [all, setAll] = useState<ShowStats[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [when, setWhen] = useState<When>('past')
  const [year, setYear] = useState('all')
  const [category, setCategory] = useState<ShowCategory | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('date')

  useEffect(() => {
    loadShowStats().then(setAll, (e: Error) => setError(e.message))
  }, [])

  const today = todayInSA()
  const years = useMemo(() => [...new Set((all ?? []).map((s) => s.show.date.slice(0, 4)))].sort().reverse(), [all])

  const rows = useMemo(() => {
    if (!all) return []
    return all.filter((r) => {
      const d = r.show.date.slice(0, 10)
      if (when === 'past' && d >= today) return false
      if (when === 'upcoming' && d < today) return false
      if (year !== 'all' && !d.startsWith(year)) return false
      if (category !== 'all' && r.show.category !== category) return false
      return true
    })
  }, [all, when, year, category, today])

  if (error) return <p className="text-red-200">{error}</p>
  if (!all) return <p className="text-mist">Adding up the numbers…</p>

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

  const sorted = [...counted].sort((a, b) => {
    if (sort === 'revenue') return b.revenueCents - a.revenueCents
    if (sort === 'tickets') return b.tickets - a.tickets
    if (sort === 'fill') return b.fillPct - a.fillPct
    return b.show.date.localeCompare(a.show.date)
  })

  const downloadCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `busker-sales-${today}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-[0.06em] text-ivory">Sales & stats</h1>
          <p className="mt-1 text-sm text-mist">Ticket sales, takings and attendance for every show sold through this site.</p>
        </div>
        <button type="button" onClick={downloadCsv} className={btnOutline} disabled={rows.length === 0}>
          <Download size={14} /> Download CSV
        </button>
      </div>

      {/* Filters */}
      <div className={`${adminCard} mt-6 grid gap-4 p-4 sm:grid-cols-3`}>
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
      </div>

      {counted.length === 0 ? (
        <p className="mt-8 text-mist">No shows match these filters.</p>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Paid takings" value={rand(revenue)} note={outstanding ? `+ ${rand(outstanding)} not paid yet` : undefined} />
            <Stat label="Tickets sold" value={tickets.toLocaleString('en-ZA')} note={`${counted.length} show${counted.length === 1 ? '' : 's'}`} />
            <Stat label="Average per show" value={rand(Math.round(revenue / counted.length))} note={`${Math.round(tickets / counted.length)} tickets`} />
            <Stat
              label="Seats filled"
              value={capacity ? `${Math.round((tickets / capacity) * 100)}%` : '—'}
              note={pastTickets ? `${Math.round((pastCheckedIn / pastTickets) * 100)}% checked in at the door` : undefined}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Panel title="Takings per month" hint="Paid takings, by month of the show">
              <MonthChart rows={counted} />
            </Panel>
            <Panel title="Where tickets were sold" hint="Tickets per sales channel">
              <SourceChart rows={counted} />
            </Panel>
            <Panel title="How far ahead people book" hint="Bookings by days before doors open">
              <LeadChart rows={counted} />
            </Panel>
            <Panel title="Best sellers" hint="Top shows by paid takings">
              <TopShows rows={counted} />
            </Panel>
          </div>

          {/* Show by show */}
          <div className={`${adminCard} mt-6 overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
              <h2 className="font-display text-lg uppercase tracking-[0.06em] text-ivory">Show by show</h2>
              <div className="flex flex-wrap gap-1">
                {(['date', 'revenue', 'tickets', 'fill'] as SortKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSort(k)}
                    className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${sort === k ? 'bg-gold/15 text-gold' : 'text-mist hover:text-ivory'}`}
                  >
                    {{ date: 'Date', revenue: 'Takings', tickets: 'Tickets', fill: '% full' }[k]}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-[0.62rem] uppercase tracking-[0.16em] text-mist">
                    <th className="px-4 py-3 font-semibold">Show</th>
                    <th className="px-4 py-3 font-semibold">Sold</th>
                    <th className="px-4 py-3 text-right font-semibold">Paid</th>
                    <th className="px-4 py-3 text-right font-semibold">Not paid yet</th>
                    <th className="px-4 py-3 text-right font-semibold">Website / manual</th>
                    <th className="px-4 py-3 text-right font-semibold">Checked in</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => {
                    const web = r.bySource.online?.tickets ?? 0
                    const isPast = r.show.date.slice(0, 10) < today
                    return (
                      <tr key={r.show.id} className="border-t border-white/5">
                        <td className="px-4 py-3">
                          <Link to={`${ADMIN_BASE}/shows/${r.show.id}/guests`} className="font-semibold text-ivory hover:text-gold">
                            {r.show.title}
                          </Link>
                          <div className="text-xs text-mist">
                            {formatShortDate(r.show.date)} {r.show.date.slice(0, 4)} · {categoryLabels[r.show.category] ?? r.show.category}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-gold" style={{ width: `${r.fillPct}%` }} />
                            </div>
                            <span className="tabular-nums text-ivory/80">
                              {r.tickets}/{r.show.capacity}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-ivory">{rand(r.revenueCents)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-mist">{r.outstandingCents ? rand(r.outstandingCents) : '—'}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-ivory/80">
                          {web} / {r.tickets - web}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-ivory/80">
                          {isPast && r.tickets ? `${r.checkedIn} (${Math.round((r.checkedIn / r.tickets) * 100)}%)` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

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
