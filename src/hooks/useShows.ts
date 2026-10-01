import { useEffect, useState } from 'react'
import { fetchShows } from '../lib/api'
import type { Show } from '../types'

/** Upcoming shows, loaded once and shared across every section on the page. */
export function useShows() {
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetchShows()
      .then((data) => alive && setShows(data))
      .catch(() => alive && setShows([]))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  return { shows, loading }
}
