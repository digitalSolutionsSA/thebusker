import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'
import { useSectionReveal } from '../../../hooks/useSectionReveal'
import Logo from '../../../components/ui/Logo'
import GLPhoto from '../../../components/three/GLPhoto'
import { images } from '../../../data/images'

/** Layered WebGL photo collage (each layer drifts at its own speed) beside the venue story. */
export default function AboutStory() {
  const root = useSectionReveal<HTMLElement>()
  const collage = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const scrub = { trigger: collage.current, start: 'top bottom', end: 'bottom top', scrub: true }
      gsap.fromTo('[data-layer="back"]', { yPercent: 8 }, { yPercent: -8, ease: 'none', scrollTrigger: scrub })
      gsap.fromTo('[data-layer="front"]', { yPercent: 22, rotate: 4 }, { yPercent: -16, rotate: -2, ease: 'none', scrollTrigger: scrub })
      gsap.fromTo('[data-layer="badge"]', { rotate: -25 }, { rotate: 25, ease: 'none', scrollTrigger: scrub })
    },
    { scope: collage },
  )

  return (
    <section ref={root} className="mx-auto grid max-w-[90rem] items-center gap-20 px-5 py-28 sm:px-8 sm:py-36 lg:grid-cols-2 lg:px-14">
      <div ref={collage} className="relative mx-auto aspect-[4/5] w-full max-w-lg">
        <div
          className="absolute -inset-10 rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgb(201 162 74 / 0.5), transparent)' }}
        />
        <div data-layer="back" className="absolute inset-y-0 left-0 right-[18%]">
          <GLPhoto src={images.venue.barNight} alt="Guests at the bar" cursor="Ripple" className="h-full w-full rounded-[2rem] border border-gold/25 shadow-2xl" />
        </div>
        <div data-layer="front" className="absolute -bottom-10 right-0 h-[48%] w-[58%]">
          <GLPhoto
            src={images.venue.bandCrowd}
            alt="A band playing to a crowd"
            className="h-full w-full rounded-[1.5rem] border-4 border-night shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] ring-1 ring-gold/40"
          />
        </div>
        <div
          data-layer="badge"
          className="absolute -left-4 top-8 grid h-28 w-28 place-items-center rounded-full border border-gold/40 bg-night/85 p-4 shadow-xl backdrop-blur-md"
        >
          <Logo className="w-full" />
        </div>
      </div>

      <div>
        <p data-sr="fade" className="eyebrow mb-7 flex items-center gap-5 text-gold">
          Our story <span className="h-px w-12 bg-current opacity-70" />
        </p>
        <h2 className="leading-[0.98] text-[clamp(2.3rem,4.8vw,4.4rem)]">
          <span className="mask-line">
            <span className="type-thin text-ivory/90">Great food,</span>
          </span>
          <span className="mask-line">
            <span className="type-heavy text-gold-leaf">good shows &amp;</span>
          </span>
          <span className="mask-line">
            <span className="type-heavy text-gold-leaf">nights to remember</span>
          </span>
        </h2>
        <span data-rule className="gold-rule mt-8 max-w-[12rem]" />
        <div className="mt-8 space-y-5 font-serif text-xl leading-relaxed text-ivory/80">
          <p data-sr="up">
            The Busker Music Hall &amp; Venue is the new home of great food, good shows and unforgettable nights in Vereeniging. Enjoy good
            food, refreshing drinks and great live performances — all under one roof.
          </p>
          <p data-sr="up" data-sr-delay="150">
            And when the Springboks play, V-Town turns into Bok Town: the big screen comes on, the Castle is ice-cold and the room fills up
            with green and gold.
          </p>
        </div>
      </div>
    </section>
  )
}
