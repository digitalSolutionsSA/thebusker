import { Check } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import StatusMessage from '../../sections/shared/StatusMessage'
import Button from '../../components/ui/Button'
import { bookingRef } from '../../lib/format'

export default function BookingSuccess() {
  const [params] = useSearchParams()
  const bookingId = params.get('booking_id')

  return (
    <StatusMessage
      icon={<Check size={32} />}
      eyebrow="Booking confirmed"
      title="You're on the list!"
      body={
        bookingId ? (
          <>
            Your booking reference is{' '}
            <strong className="whitespace-nowrap font-sans tracking-[0.15em] text-gold">{bookingRef(bookingId)}</strong>. Give your name or
            this reference at the door. We can't wait to see you at The Busker.
          </>
        ) : (
          "Give your name at the door. We can't wait to see you at The Busker."
        )
      }
      actions={
        <>
          <Button to="/shows">See more shows</Button>
          <Button to="/" variant="outline">
            Back home
          </Button>
        </>
      }
    />
  )
}
