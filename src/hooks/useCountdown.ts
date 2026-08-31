import { useEffect, useState } from 'react'

export function useCountdown(target: string) {
  const [remaining, setRemaining] = useState(() => new Date(target).getTime() - Date.now())

  useEffect(() => {
    setRemaining(new Date(target).getTime() - Date.now())
    const id = setInterval(() => setRemaining(new Date(target).getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [target])

  if (remaining <= 0) return null
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((remaining / (1000 * 60)) % 60)
  return { days, hours, minutes }
}
