import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { isStaff } from '../lib/admin'

export type StaffStatus = 'loading' | 'signed-out' | 'not-staff' | 'staff' | 'unconfigured'

/** The admin portal's sign-in state: signed in, and allowed in (has a row in the staff table)? */
export function useStaffSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<StaffStatus>(supabase ? 'loading' : 'unconfigured')

  useEffect(() => {
    if (!supabase) return
    let alive = true

    const check = async (s: Session | null) => {
      if (!alive) return
      setSession(s)
      if (!s) return setStatus('signed-out')
      try {
        const ok = await isStaff()
        if (alive) setStatus(ok ? 'staff' : 'not-staff')
      } catch {
        if (alive) setStatus('not-staff')
      }
    }

    supabase.auth.getSession().then(({ data }) => check(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Defer: Supabase warns against awaiting its own calls inside this callback
      setTimeout(() => check(s), 0)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { session, status, email: session?.user.email ?? null }
}

export async function signOut() {
  await supabase?.auth.signOut()
}
