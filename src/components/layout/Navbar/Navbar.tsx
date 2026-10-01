import { useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { navLinks } from '../../../config/site'
import { gsap, useGSAP, ScrollTrigger } from '../../../lib/gsap'
import Logo from '../../ui/Logo'
import Button from '../../ui/Button'
import MobileMenu from '../MobileMenu'

export default function Navbar() {
  const header = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const isBokTown = pathname.startsWith('/bok-town')

  useGSAP(
    () => {
      // Slide away while scrolling down, come back on the slightest scroll up.
      const hide = gsap.to(header.current, { yPercent: -110, duration: 0.45, ease: 'power3.inOut', paused: true })
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          setScrolled(self.scroll() > 40)
          if (self.scroll() < 120 || self.direction === -1) hide.reverse()
          else hide.play()
        },
      })
    },
    { scope: header },
  )

  const accent = isBokTown ? 'bg-bok-gold' : 'bg-ember-light'

  return (
    <>
      <header
        ref={header}
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,padding,border-color] duration-500 ${
          scrolled ? 'bg-night/75 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent border-b border-transparent py-5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" aria-label="The Busker — home" className="shrink-0">
            <Logo eager className={`transition-[width] duration-500 ${scrolled ? 'w-28' : 'w-32 sm:w-36'}`} />
          </Link>

          <nav className="hidden lg:flex items-center gap-9" aria-label="Main">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `group relative py-2 text-[0.7rem] font-semibold uppercase tracking-[0.25em] transition-colors ${
                    isActive ? 'text-ivory' : 'text-ivory/60 hover:text-ivory'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    <span
                      className={`absolute -bottom-0.5 left-0 h-px w-full origin-left transition-transform duration-500 ease-[var(--ease-luxe)] ${accent} ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <Button to="/shows" size="sm" variant="outline" magnetic>
                Get Tickets
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="lg:hidden grid h-11 w-11 place-items-center rounded-full border border-white/15 text-ivory hover:bg-white/5"
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
