import { Link } from 'react-router-dom'

export default function BookingSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-6 text-center">
      <div>
        <p className="text-brass-light uppercase tracking-[0.4em] text-xs mb-4">Booking Confirmed</p>
        <h1 className="font-display text-4xl text-cream mb-4">You're on the list! 🎸</h1>
        <p className="text-cream/60 mb-8 max-w-md mx-auto">
          Check your email for your ticket confirmation. We can't wait to see you at The Busker.
        </p>
        <Link
          to="/shows"
          className="inline-block brass-gradient text-ink font-semibold uppercase tracking-widest text-sm px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
        >
          See More Shows
        </Link>
      </div>
    </div>
  )
}
