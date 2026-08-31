import Hero from '../components/Hero'
import BokTown from '../components/BokTown'
import UpcomingShowsSummary from '../components/UpcomingShowsSummary'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <>
      <Hero />
      <BokTown />
      <UpcomingShowsSummary />

      <section className="py-28 bg-ink">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="uppercase tracking-[0.5em] text-brass-light text-xs mb-4">
              Get To Know The Busker
            </p>
            <h2 className="font-display text-4xl text-cream mb-6">
              The new home of great food, good shows &amp; unforgettable nights.
            </h2>
            <p className="text-cream/60 leading-relaxed mb-6">
              Enjoy good food, refreshing drinks and great live performances under one roof. It's
              the perfect spot for a date night, a family outing, or celebrating with friends — and
              on Springbok weekends, it's the beating heart of Bok Town.
            </p>
            <Link
              to="/shows"
              className="inline-block brass-gradient text-ink font-semibold uppercase tracking-widest text-sm px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
            >
              See Upcoming Shows
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {['Live Music', 'Great Food', 'Cold Taps', 'Big Screen Rugby'].map((f) => (
              <div key={f} className="card-glass rounded-xl p-6 text-center">
                <p className="font-display text-lg text-brass-light">{f}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
