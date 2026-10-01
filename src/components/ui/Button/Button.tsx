import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { gsap, useGSAP, prefersReducedMotion } from '../../../lib/gsap'

type Variant = 'primary' | 'outline' | 'ghost' | 'gold' | 'bok'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  children: ReactNode
  to?: string
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: Variant
  size?: Size
  disabled?: boolean
  /** Button gently follows the cursor on hover (desktop only) */
  magnetic?: boolean
  className?: string
  external?: boolean
  ariaLabel?: string
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  // Polished gold bar: highlight → gold → deep brass, with a light sweep on hover
  primary:
    'bg-[linear-gradient(115deg,#f6e3b0_0%,#d9b45c_35%,#a8842a_70%,#e2bd6d_100%)] text-night shadow-[0_12px_40px_-12px_rgb(201_162_74/0.75),inset_0_1px_0_rgb(255_255_255/0.45)] hover:brightness-110 before:bg-gradient-to-r before:from-white/0 before:via-white/45 before:to-white/0',
  outline: 'border border-gold/40 text-ivory hover:border-gold hover:bg-gold/10',
  ghost: 'text-ivory/80 hover:text-ivory',
  gold: 'bg-gradient-to-r from-gold-light via-gold to-[#b48c3c] text-night shadow-[0_10px_40px_-12px_rgb(226_189_109/0.7)] before:bg-gradient-to-r before:from-white/0 before:via-white/40 before:to-white/0',
  bok: 'bg-bok-grass text-white hover:bg-[#21a057] shadow-[0_10px_40px_-12px_rgb(28_138_74/0.9)] before:bg-gradient-to-r before:from-white/0 before:via-white/25 before:to-white/0',
}

const sizes: Record<Size, string> = {
  sm: 'text-[0.68rem] px-5 py-2.5 gap-2',
  md: 'text-xs px-7 py-3.5 gap-2.5',
  lg: 'text-sm px-9 py-4.5 gap-3',
}

export default function Button({
  children,
  to,
  href,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled,
  magnetic = false,
  className = '',
  external,
  ariaLabel,
  fullWidth = false,
}: Props) {
  const wrapRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const wrap = wrapRef.current
      if (!magnetic || !wrap || prefersReducedMotion() || !matchMedia('(pointer: fine)').matches) return

      const xTo = gsap.quickTo(wrap, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' })
      const yTo = gsap.quickTo(wrap, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' })
      const move = (e: PointerEvent) => {
        const r = wrap.getBoundingClientRect()
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3)
        yTo((e.clientY - (r.top + r.height / 2)) * 0.4)
      }
      const leave = () => {
        xTo(0)
        yTo(0)
      }
      wrap.addEventListener('pointermove', move)
      wrap.addEventListener('pointerleave', leave)
      return () => {
        wrap.removeEventListener('pointermove', move)
        wrap.removeEventListener('pointerleave', leave)
      }
    },
    { dependencies: [magnetic] },
  )

  const classes = [
    'group relative inline-flex items-center justify-center overflow-hidden rounded-full font-semibold uppercase tracking-[0.2em] whitespace-nowrap',
    'transition-[background-color,border-color,color,box-shadow,opacity] duration-300',
    // light sweep on hover
    'before:absolute before:inset-0 before:-translate-x-full before:transition-transform before:duration-700 before:ease-[var(--ease-luxe)] hover:before:translate-x-full',
    'disabled:pointer-events-none disabled:opacity-40',
    variants[variant],
    sizes[size],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ')

  const content = <span className="relative z-10 inline-flex items-center gap-[inherit]">{children}</span>

  let element: ReactNode
  if (to) {
    element = (
      <Link to={to} className={classes} onClick={onClick} aria-label={ariaLabel}>
        {content}
      </Link>
    )
  } else if (href) {
    element = (
      <a
        href={href}
        className={classes}
        onClick={onClick}
        aria-label={ariaLabel}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {content}
      </a>
    )
  } else {
    element = (
      <button type={type} className={classes} onClick={onClick} disabled={disabled} aria-label={ariaLabel}>
        {content}
      </button>
    )
  }

  return (
    <span ref={wrapRef} className={`${fullWidth ? 'block w-full' : 'inline-block'} will-change-transform`}>
      {element}
    </span>
  )
}
