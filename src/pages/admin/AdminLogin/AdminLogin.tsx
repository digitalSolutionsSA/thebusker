import { useState, type FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useStaffSession } from '../../../hooks/useStaffSession'
import { adminInput, adminLabel, btnGold } from '../../../components/admin/ui'
import { ADMIN_BASE } from '../../../config/site'
import Logo from '../../../components/ui/Logo'

/** Staff sign-in for the admin portal, with a "forgot password" email link. */
export default function AdminLogin() {
  const { status } = useStaffSession()
  const [params] = useSearchParams()
  const next = params.get('next')?.startsWith(ADMIN_BASE) ? params.get('next')! : ADMIN_BASE

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null)

  if (status === 'staff' || status === 'not-staff') return <Navigate to={next} replace />

  const signIn = async (e: FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setMessage({ tone: 'error', text: error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message })
  }

  const forgot = async () => {
    if (!supabase) return
    if (!email.trim()) {
      setMessage({ tone: 'error', text: 'Enter your email address first, then tap "Forgot password".' })
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}${ADMIN_BASE}/set-password` })
    setBusy(false)
    setMessage(error ? { tone: 'error', text: error.message } : { tone: 'info', text: 'Check your email for a link to set a new password.' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-night px-5 text-ivory">
      <form onSubmit={signIn} className="w-full max-w-sm">
        <Logo eager className="mx-auto w-48" />
        <p className="mt-4 text-center text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-gold">Admin portal</p>
        <p className="mt-2 text-center text-sm text-mist">Sign in to manage shows and guest lists.</p>

        <div className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className={adminLabel}>Email</label>
            <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={adminInput} />
          </div>
          <div>
            <label htmlFor="password" className={adminLabel}>Password</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={adminInput} />
          </div>
        </div>

        {message && (
          <p role="alert" className={`mt-4 rounded-xl px-4 py-3 text-sm ${message.tone === 'error' ? 'border border-red-400/30 bg-red-500/10 text-red-200' : 'border border-gold/30 bg-gold/10 text-ivory'}`}>
            {message.text}
          </p>
        )}

        <button type="submit" disabled={busy || status === 'loading'} className={`${btnGold} mt-6 w-full py-3.5`}>
          {busy ? 'Please wait…' : 'Sign in'}
        </button>
        <button type="button" onClick={forgot} disabled={busy} className="mt-4 w-full text-center text-xs text-mist hover:text-ivory">
          Forgot password?
        </button>
      </form>
    </div>
  )
}
