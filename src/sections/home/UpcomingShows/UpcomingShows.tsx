import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useShows } from '../../../hooks/useShows'
import { useSectionReveal } from '../../../hooks/useSectionReveal'
import SectionHeading from '../../../components/ui/SectionHeading'
import ShowCard from '../../../components/shows/ShowCard'

export default function UpcomingShows() {
  const { shows, loading } = useShows()
  const gridRef = useSectionReveal<HTMLElement>([shows.length])
  const featured = shows.slice(0, 4)

  return (
    <section ref={gridRef} id="upcoming" className="relative mx-auto max-w-7xl scroll-mt-24 px-5 pt-12 pb-24 sm:px-8 sm:pb-32">
      <SectionHeading
        title="Upcoming Shows"
        action={
          <Link to="/shows" className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold hover:text-ivory">
            View all shows <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        }
      />

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      ) : featured.length === 0 ? (
        <p className="text-mist">New shows are being announced soon — check back shortly.</p>
      ) : (
        <div data-stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((show) => (
            <ShowCard key={show.id} show={show} />
          ))}
        </div>
      )}
    </section>
  )
}
