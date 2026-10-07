import { useState } from 'react'
import { useShows } from '../../hooks/useShows'
import { images } from '../../data/images'
import PageHero from '../../sections/shared/PageHero'
import CtaBanner from '../../sections/shared/CtaBanner'
import Spotlight from '../../sections/shared/Spotlight'
import NextShowSpotlight from '../../sections/shows/NextShowSpotlight'
import ShowFilters, { type ShowFilter } from '../../sections/shows/ShowFilters'
import PremiumExperience from '../../sections/shows/PremiumExperience'
import ShowRow from '../../components/shows/ShowRow'

export default function Shows() {
  const { shows, loading } = useShows()
  const [filter, setFilter] = useState<ShowFilter>('all')

  const filtered = shows.filter((s) => filter === 'all' || s.category === filter)
  const counts = {
    all: shows.length,
    'live-music': shows.filter((s) => s.category === 'live-music').length,
    'bok-town': shows.filter((s) => s.category === 'bok-town').length,
  }

  return (
    <>
      <PageHero
        slim
        centered
        images={[images.hero.blueBeams, images.hero.blueBand, images.hero.bandSmoke]}
        eyebrow="What's on"
        thin="Shows &"
        title="Tickets"
      />

      {/* Every upcoming show, straight under a slim header — no scroll reveal, so they're visible instantly */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 pb-20 sm:px-8">
        <div className="mb-6 flex justify-center">
          <ShowFilters value={filter} onChange={setFilter} counts={counts} />
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-mist">No shows in this category yet — check back soon.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((show) => (
              <ShowRow key={show.id} show={show} />
            ))}
          </div>
        )}
      </section>

      <section className="relative mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        {shows.length > 0 && <NextShowSpotlight shows={shows.slice(0, 5)} />}
      </section>

      <PremiumExperience />
      <Spotlight
        image={images.hero.handsUp}
        heavy="Don't miss"
        thin="a single night."
        eyebrow="Tickets are limited"
        copy="Book online in a minute and pay securely — your seats are confirmed by email."
      />
      <CtaBanner script="Don't miss out" title="Book your tickets now" />
    </>
  )
}
