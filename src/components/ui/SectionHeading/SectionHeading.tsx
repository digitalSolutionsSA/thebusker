import type { ReactNode } from 'react'
import { useSectionReveal } from '../../../hooks/useSectionReveal'

interface Props {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  align?: 'left' | 'center'
  tone?: 'ember' | 'gold' | 'bok'
  action?: ReactNode
  className?: string
}

const eyebrowTone = {
  ember: 'text-gold',
  gold: 'text-gold',
  bok: 'text-bok-gold',
}

/** Gold-leaf Roman-capital heading: the title rises out of a mask and a gold rule draws in under it. */
export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  tone = 'ember',
  action,
  className = '',
}: Props) {
  const ref = useSectionReveal<HTMLDivElement>()
  const centered = align === 'center'
  const leaf = tone === 'bok' ? 'text-white' : 'text-gold-leaf'

  return (
    <div
      ref={ref}
      className={`mb-12 md:mb-16 flex flex-col gap-6 ${
        centered ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'
      } ${className}`}
    >
      <div className={centered ? 'max-w-3xl' : 'max-w-3xl'}>
        {eyebrow && (
          <p data-sr="fade" className={`eyebrow mb-5 flex items-center gap-4 ${eyebrowTone[tone]} ${centered ? 'justify-center' : ''}`}>
            <span className="h-px w-10 bg-current opacity-60" />
            {eyebrow}
            {centered && <span className="h-px w-10 bg-current opacity-60" />}
          </p>
        )}
        <h2 className={`font-display uppercase text-[clamp(2rem,4.4vw,3.6rem)] ${leaf} text-balance`}>
          <span className="mask-line">
            <span>{title}</span>
          </span>
        </h2>
        <span data-rule className={`gold-rule mt-6 max-w-[14rem] ${centered ? 'mx-auto' : ''}`} />
        {subtitle && (
          <p data-sr="up" className={`mt-6 font-serif text-lg leading-relaxed text-ivory/75 sm:text-xl ${centered ? 'mx-auto max-w-xl' : 'max-w-xl'}`}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div data-sr="left" className="shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}
