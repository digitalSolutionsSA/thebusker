import { Tv } from 'lucide-react'
import { useShows } from '../../../hooks/useShows'
import { useSectionReveal } from '../../../hooks/useSectionReveal'
import SectionHeading from '../../../components/ui/SectionHeading'
import FixtureCard from '../../../components/shows/FixtureCard'
import Button from '../../../components/ui/Button'

export default function FixturesSection() {
  const { shows, loading } = useShows()
  const fixtures = shows.filter((s) => s.category === 'bok-town')
  const root = useSectionReveal<HTMLElement>([fixtures.length])

  return (
    <section ref={root} id="fixtures" className="relative scroll-mt-24 py-24 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <SectionHeading title="Upcoming Springbok Fixtures" />

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
            ))}
          </div>
        ) : fixtures.length === 0 ? (
          <div data-sr="zoom" className="glass gold-frame relative rounded-2xl px-8 py-14 text-center">
            <Tv size={40} strokeWidth={1.1} className="mx-auto text-gold" />
            <p className="mt-6 font-display text-2xl uppercase text-gold-leaf">Fixtures coming soon</p>
            <p className="mx-auto mt-3 max-w-md font-serif text-lg text-ivory/75">
              The next Springbok screenings are being lined up. Get in touch to reserve a table for match day.
            </p>
            <div className="mt-8">
              <Button to="/contact">Reserve a table</Button>
            </div>
          </div>
        ) : (
          <div data-stagger className="space-y-4">
            {fixtures.map((show) => (
              <FixtureCard key={show.id} show={show} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
