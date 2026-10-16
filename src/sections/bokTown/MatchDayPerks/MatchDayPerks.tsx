import { Music2, Tv, UtensilsCrossed } from 'lucide-react'
import { useSectionReveal } from '../../../hooks/useSectionReveal'
import { images } from '../../../data/images'
import GLPhoto from '../../../components/three/GLPhoto'

const perks = [
  {
    icon: Tv,
    image: images.bok.venueScreen,
    title: '4m × 2m Big Screen',
    body: 'Every scrum and every try in HD on a screen 4 metres wide and 2 metres high, with sound to match.',
  },
  {
    icon: UtensilsCrossed,
    image: images.venue.charcuterie,
    title: 'Match-Day Platters',
    body: 'Your ticket includes a platter, Castle Double Malt & a Springbokkie.',
  },
  {
    icon: Music2,
    image: images.bok.anthem,
    title: 'Green & Gold Atmosphere',
    body: 'Sing the anthem with a room full of fellow supporters.',
  },
]

/** Green & gold match-day showcase: the hall dressed for a Springbok test, full width, with the three match-day perks below. */
export default function MatchDayPerks() {
  const root = useSectionReveal<HTMLElement>()

  return (
    <section ref={root} className="relative isolate overflow-hidden bg-bok-night py-24 sm:py-32">
      {/* Stadium-light glow: green from the sides, gold from above */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_45%_at_50%_0%,rgb(255_199_44/0.22),transparent_70%),radial-gradient(45%_60%_at_0%_55%,rgb(28_138_74/0.45),transparent_70%),radial-gradient(45%_60%_at_100%_55%,rgb(28_138_74/0.45),transparent_70%)]"
      />
      {/* Flag-stripe edges */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#0b3d24_0%,#1c8a4a_35%,#ffc72c_50%,#1c8a4a_65%,#0b3d24_100%)]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1.5 bg-[linear-gradient(90deg,#0b3d24_0%,#1c8a4a_35%,#ffc72c_50%,#1c8a4a_65%,#0b3d24_100%)]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center">
          <p data-sr="fade" className="eyebrow flex items-center justify-center gap-4 text-bok-gold">
            <span className="h-px w-6 shrink-0 bg-current opacity-60 sm:w-10" />
            Match day at The Busker
            <span className="h-px w-6 shrink-0 bg-current opacity-60 sm:w-10" />
          </p>
          <h2 className="mt-6 font-brush text-[clamp(2.8rem,7vw,5.5rem)] leading-[1.05] -rotate-2">
            <span className="mask-line px-[0.2em] pb-2">
              <span className="px-[0.1em] text-bok-gold">Everything but</span>
            </span>
            <span className="mask-line px-[0.2em] pb-2">
              <span className="px-[0.1em] text-white">the kick-off</span>
            </span>
          </h2>
          <p data-sr="up" className="mx-auto mt-8 max-w-xl font-serif text-xl leading-relaxed text-ivory/85">
            Book a table, bring the crew and leave the rest to us.
          </p>
        </div>
      </div>

      {/* The hall on match day, edge to edge and unfiltered: the centrepiece */}
      <figure data-wipe="up" className="mt-14 border-y-2 border-bok-gold/60">
        <img
          src={images.bok.venueScreen}
          alt="The Busker's hall on match day: the Springbok emblem on the big screen, lit in green and gold"
          loading="lazy"
          className="block aspect-[16/9] max-h-[85vh] w-full object-cover"
        />
      </figure>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* The screen's size is the headline fact */}
        <div className="mt-12 flex flex-col items-center gap-4 text-center md:flex-row md:justify-center md:gap-10 md:text-left">
          <p data-sr="up" className="font-brush text-[clamp(4rem,11vw,8.5rem)] leading-none text-bok-gold drop-shadow-[0_0_40px_rgb(255_199_44/0.35)]">
            4<span className="font-sans text-[0.42em] font-bold">m</span> <span className="text-white">×</span> 2<span className="font-sans text-[0.42em] font-bold">m</span>
          </p>
          <div data-sr="up" data-sr-delay="100" className="max-w-sm">
            <p className="font-display text-2xl uppercase text-white">One massive screen</p>
            <p className="mt-2 text-ivory/80">
              Four metres wide and two metres high: 8 square metres of Springbok rugby, so you catch every scrum, every line-out and every try.
            </p>
          </div>
        </div>

        {/* 01 · 02 · 03 */}
        <div data-stagger className="mt-14 grid gap-5 md:grid-cols-3">
          {perks.map(({ icon: Icon, image, title, body }, i) => (
            <div key={title}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-bok-gold/30 bg-bok-green/85 shadow-[0_30px_70px_-25px_rgb(0_0_0/0.9)] transition-colors duration-500 hover:border-bok-gold">
                <GLPhoto src={image} alt={title} cursor="Ripple" className="h-40">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bok-green via-bok-green/30 to-transparent" />
                  <span className="pointer-events-none absolute right-4 top-1 font-brush text-6xl leading-none text-bok-gold/80 drop-shadow">0{i + 1}</span>
                </GLPhoto>
                <div className="relative -mt-7 p-6 pt-0">
                  <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-bok-gold text-bok-night shadow-lg transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                    <Icon size={24} />
                  </div>
                  <h3 className="font-display text-xl uppercase text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ivory/80">{body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
