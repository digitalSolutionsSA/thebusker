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
          <div
            data-sr="zoom"
            className="relative overflow-hidden rounded-2xl border border-bok-gold/50 bg-[radial-gradient(80%_120%_at_50%_0%,#1c8a4a_0%,#0b3d24_55%,#04140b_100%)] px-8 py-14 text-center shadow-[0_40px_100px_-40px_rgb(28_138_74/0.8)]"
          >
            {/* Flag-stripe top edge */}
            <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#0b3d24_0%,#1c8a4a_35%,#ffc72c_50%,#1c8a4a_65%,#0b3d24_100%)]" />
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-bok-gold text-bok-night shadow-[0_10px_40px_-10px_rgb(255_199_44/0.7)]">
              <Tv size={30} strokeWidth={1.6} />
            </div>
            <p className="mt-6 font-display text-2xl uppercase text-bok-gold">Fixtures coming soon</p>
            <p className="mx-auto mt-3 max-w-md font-serif text-lg text-ivory/85">
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
