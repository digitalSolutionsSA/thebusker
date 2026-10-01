import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { navLinks, site } from '../../../config/site'
import { gsap, useGSAP } from '../../../lib/gsap'
import Logo from '../../ui/Logo'
import Button from '../../ui/Button'

interface Props {
  open: boolean
  onClose: () => void
}

export default function MobileMenu({ open, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline>(null)

  useGSAP(
    () => {
      tl.current = gsap
        .timeline({ paused: true })
        .set(root.current, { visibility: 'visible' })
        .fromTo(root.current, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: 0.8, ease: 'power4.inOut' })
        .from('[data-menu-item]', { yPercent: 110, opacity: 0, stagger: 0.06, duration: 0.7 }, '-=0.35')
        .from('[data-menu-foot]', { opacity: 0, y: 20, duration: 0.5 }, '-=0.4')
    },
    { scope: root },
  )

  useEffect(() => {
    if (open) tl.current?.timeScale(1).play()
    else tl.current?.timeScale(1.6).reverse()
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      ref={root}
      className="invisible fixed inset-0 z-[60] flex flex-col bg-night grain lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      aria-hidden={!open}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 80% 10%, rgb(201 162 74 / 0.35), transparent 55%)' }}
      />
      <div className="relative flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo className="w-32" />
        <button
          type="button"
          onClick={onClose}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-ivory"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="relative flex flex-1 flex-col justify-center gap-2 px-6 sm:px-10" aria-label="Mobile">
        {navLinks.map((link, i) => (
          <div key={link.to} className="overflow-hidden">
            <NavLink
              data-menu-item
              to={link.to}
              end={link.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-baseline gap-4 font-display uppercase text-4xl sm:text-5xl leading-tight ${
                  isActive ? 'text-ivory' : 'text-ivory/50'
                }`
              }
            >
              <span className="font-sans text-xs tracking-widest text-gold">0{i + 1}</span>
              {link.label}
            </NavLink>
          </div>
        ))}
      </nav>

      <div data-menu-foot className="relative space-y-6 px-6 pb-10 sm:px-10">
        <Button to="/shows" onClick={onClose} fullWidth size="lg">
          Get Tickets
        </Button>
        <p className="text-center text-xs uppercase tracking-[0.3em] text-mist">{site.address.lines[1]}</p>
      </div>
    </div>
  )
}
