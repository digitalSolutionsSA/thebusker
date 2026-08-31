import { Link } from 'react-router-dom'

export default function BookingCancelled() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-6 text-center">
      <div>
        <p className="text-brass-light uppercase tracking-[0.4em] text-xs mb-4">Booking Cancelled</p>
        <h1 className="font-display text-4xl text-cream mb-4">No worries.</h1>
        <p className="text-cream/60 mb-8 max-w-md mx-auto">
          Your payment was cancelled and you haven't been charged. You can try booking again
          whenever you're ready.
        </p>
        <Link
          to="/shows"
          className="inline-block brass-gradient text-ink font-semibold uppercase tracking-widest text-sm px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
        >
          Back to Shows
        </Link>
      </div>
    </div>
  )
}
