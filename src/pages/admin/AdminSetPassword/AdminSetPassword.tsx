import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import { useStaffSession } from '../../../hooks/useStaffSession'
import { AdminMessage } from '../../../components/admin/AdminLayout'
import { adminInput, adminLabel, btnGold } from '../../../components/admin/ui'
import { ADMIN_BASE } from '../../../config/site'

/** Where the "forgot password" and invite emails land: choose a new password. */
export default function AdminSetPassword() {
  const { status } = useStaffSession()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (status === 'loading') return <AdminMessage text="Checking your link…" />
  if (status === 'signed-out' || status === 'unconfigured') {
    return <AdminMessage text="This link has expired or was already used. Go to the sign-in page and tap “Forgot password” to get a new one." />
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError('The two passwords don’t match.')
    setBusy(true)
    const { error } = await supabase!.auth.updateUser({ password })
    setBusy(false)
    if (error) setError(error.message)
    else navigate(ADMIN_BASE, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-night px-5 text-ivory">
      <form onSubmit={save} className="w-full max-w-sm">
        <p className="text-center font-display text-2xl uppercase tracking-[0.12em] text-gold">Set your password</p>
        <div className="mt-8 space-y-4">
          <div>
            <label htmlFor="pw" className={adminLabel}>New password</label>
            <input id="pw" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={adminInput} />
          </div>
          <div>
            <label htmlFor="pw2" className={adminLabel}>Repeat it</label>
            <input id="pw2" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={adminInput} />
          </div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
        <button type="submit" disabled={busy} className={`${btnGold} mt-6 w-full py-3.5`}>
          {busy ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </div>
  )
}
