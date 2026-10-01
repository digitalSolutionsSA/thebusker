import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'
import Button from '../../../components/ui/Button'
import Photo from '../../../components/ui/Photo'
import { images } from '../../../data/images'

interface Props {
  title?: string
  script?: string
  body?: string
  image?: string
}

/**
 * Closing call-to-action: an inset gold-framed panel that opens out to full-bleed as you scroll
 * (scrubbed clip-path), photo settling from a zoom, headline lines rising out of masks.
 */
export default function CtaBanner({
  title = 'Your next great night starts here',
  script = 'See you at the show',
  body = 'Good food, cold drinks and live music under one roof. Grab your seats before they’re gone.',
  image = images.hero.bandStage,
}: Props) {
  const root = useRef<HTMLElement>(null)
  const words = title.split(' ')
  const half = Math.ceil(words.length / 2)
  const lines = words.length > 3 ? [words.slice(0, half).join(' '), words.slice(half).join(' ')] : [title]

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const scrub = { trigger: root.current, start: 'top 90%', end: 'top 15%', scrub: 1 }
      gsap.fromTo(
        '[data-cta-panel]',
        { clipPath: 'inset(12% 9% 12% 9% round 2rem)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0rem)', ease: 'none', scrollTrigger: scrub },
      )
      gsap.fromTo('[data-cta-photo]', { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { ...scrub, end: 'bottom top' } })
      gsap.from('[data-cta-line] > span', {
        yPercent: 115,
        duration: 1.4,
        stagger: 0.12,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-cta-copy]', start: 'top 80%' },
      })
      gsap.from('[data-cta-fade]', {
        opacity: 0,
        y: 30,
        duration: 1.2,
        stagger: 0.1,
        ease: 'expo.out',
        scrollTrigger: { trigger: '[data-cta-copy]', start: 'top 75%' },
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} className="relative">
      <div data-cta-panel className="relative isolate flex min-h-[85vh] items-center justify-center overflow-hidden px-5 py-28 text-center sm:px-8">
        <div data-cta-photo className="absolute inset-0 -z-20">
          <Photo src={image} alt="" className="absolute inset-0" />
        </div>
        <div className="absolute inset-0 -z-10 bg-night/70" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,transparent_10%,rgb(15_11_7/0.85)_80%)]" />

        <div data-cta-copy className="max-w-4xl">
          <p data-cta-fade className="font-script text-3xl text-gold sm:text-4xl">
            {script}
          </p>
          <h2 className="mt-5 leading-[0.98] text-[clamp(2.4rem,6vw,5.6rem)]">
            {lines.map((l, i) => (
              <span key={l} data-cta-line className="mask-line">
                <span className={i === 0 && lines.length > 1 ? 'type-thin text-ivory' : 'type-heavy text-gold-leaf'}>{l}</span>
              </span>
            ))}
          </h2>
          <p data-cta-fade className="mx-auto mt-7 max-w-xl font-serif text-xl text-ivory/80">
            {body}
          </p>
          <div data-cta-fade className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button to="/shows" size="lg" magnetic>
              Upcoming shows <ArrowRight size={16} />
            </Button>
            <Button to="/contact" variant="outline" size="lg">
              Plan a visit
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
