import { useSectionReveal } from '../../../hooks/useSectionReveal'
import Photo from '../../../components/ui/Photo'
import { images } from '../../../data/images'

/** Full-bleed crowd photo with a centred gold quote — the closing note from the mockup. */
export default function QuoteBanner({ quote = ['Great music brings', 'great people together.'] }: { quote?: string[] }) {
  const root = useSectionReveal<HTMLElement>()

  return (
    <section ref={root} className="relative isolate overflow-hidden py-28 sm:py-40">
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <div data-parallax="10" className="absolute -inset-y-[12%] inset-x-0">
          <Photo src={images.hero.blueBand} alt="" className="absolute inset-0" />
        </div>
      </div>
      <div className="absolute inset-0 -z-10 bg-night/70" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-night via-transparent to-night" />

      <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
        <span data-sr="zoom" className="block font-serif text-7xl leading-none text-gold">“</span>
        <blockquote className="font-display uppercase text-gold-leaf text-[clamp(1.8rem,4.6vw,3.6rem)] leading-[1.1]">
          {quote.map((line) => (
            <span key={line} className="mask-line">
              <span>{line}</span>
            </span>
          ))}
        </blockquote>
        <div data-sr="fade" data-sr-delay="400" className="ornament mx-auto mt-10 max-w-xs text-xs">
          ✦
        </div>
      </div>
    </section>
  )
}
