import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { releaseBooking } from '../../lib/api'
import StatusMessage from '../../sections/shared/StatusMessage'
import Button from '../../components/ui/Button'

export default function BookingCancelled() {
  const [params] = useSearchParams()
  const bookingId = params.get('booking_id')

  // Give the held seats back to everyone else straight away instead of waiting for the hold to expire
  useEffect(() => {
    if (bookingId) releaseBooking(bookingId).catch(() => {})
  }, [bookingId])

  return (
    <StatusMessage
      eyebrow="Booking cancelled"
      title="No worries."
      body="Your payment was cancelled and you haven't been charged. You can try booking again whenever you're ready."
      actions={
        <>
          <Button to="/shows">Back to shows</Button>
          <Button to="/contact" variant="outline">
            Need help?
          </Button>
        </>
      }
    />
  )
}
