import { Suspense, useEffect, type ReactNode } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { signOut, useStaffSession } from '../../../hooks/useStaffSession'
import { ADMIN_BASE, site } from '../../../config/site'
import { btnOutline } from '../ui'

/** Frame for every signed-in portal page: access check, header and navigation. */
export default function AdminLayout() {
  const { status, email } = useStaffSession()
  const location = useLocation()

  // Keep the portal out of search engines
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    const title = document.title
    document.title = `Admin · ${site.name}`
    return () => {
      meta.remove()
      document.title = title
    }
  }, [])

  if (status === 'loading') return <AdminMessage text="Loading…" />
  if (status === 'unconfigured') return <AdminMessage text="The database isn't connected (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)." />
  if (status === 'signed-out') return <Navigate to={`${ADMIN_BASE}/login?next=${encodeURIComponent(location.pathname)}`} replace />
  if (status === 'not-staff') {
    return (
      <AdminMessage text={`${email ?? 'This account'} isn't set up as staff yet. Ask an admin to give it access.`}>
        <button type="button" onClick={signOut} className={`${btnOutline} mt-6`}>
          Sign out
        </button>
      </AdminMessage>
    )
  }

  const nav = 'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors'

  return (
    <div className="min-h-screen bg-night text-ivory">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-night/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-5">
            <Link to={ADMIN_BASE} className="font-display text-lg uppercase tracking-[0.12em] text-gold">
              Busker <span className="text-ivory/50">Admin</span>
            </Link>
            <nav className="hidden gap-1 sm:flex">
              <NavLink to={ADMIN_BASE} end className={({ isActive }) => `${nav} ${isActive ? 'bg-gold/15 text-gold' : 'text-mist hover:text-ivory'}`}>
                Shows
              </NavLink>
              <NavLink to={`${ADMIN_BASE}/shows/new`} className={({ isActive }) => `${nav} ${isActive ? 'bg-gold/15 text-gold' : 'text-mist hover:text-ivory'}`}>
                Add show
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-mist md:inline">{email}</span>
            <Link to="/" className="hidden text-xs text-mist hover:text-ivory sm:inline">
              View site
            </Link>
            <button type="button" onClick={signOut} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-mist hover:text-ivory" aria-label="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Suspense fallback={<p className="text-mist">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

export function AdminMessage({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-night px-6 text-center text-ivory">
      <p className="font-display text-xl uppercase tracking-[0.12em] text-gold">Busker Admin</p>
      <p className="mt-4 max-w-md text-sm text-mist">{text}</p>
      {children}
    </div>
  )
}
