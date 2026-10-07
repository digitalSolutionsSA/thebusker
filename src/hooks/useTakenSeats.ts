import { useCallback, useEffect, useState } from 'react'
import { fetchTakenSeats } from '../lib/api'

const REFRESH_MS = 20_000

/** Seats already sold or held for a show, refreshed every 20s and whenever the tab regains focus. */
export function useTakenSeats(showId: string) {
  const [taken, setTaken] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setTaken(new Set(await fetchTakenSeats(showId)))
    } catch {
      // Keep the last known state; the server re-checks every seat at checkout anyway
    } finally {
      setLoading(false)
    }
  }, [showId])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(refresh, REFRESH_MS)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [refresh])

  /** Mark seats taken straight away (e.g. after checkout reports they were just sold) */
  const markTaken = useCallback((ids: string[]) => setTaken((prev) => new Set([...prev, ...ids])), [])

  return { taken, loading, refresh, markTaken }
}
