import { Check } from 'lucide-react'
import StatusMessage from '../../sections/shared/StatusMessage'
import Button from '../../components/ui/Button'

export default function BookingSuccess() {
  return (
    <StatusMessage
      icon={<Check size={32} />}
      eyebrow="Booking confirmed"
      title="You're on the list!"
      body="Check your email for your ticket confirmation. We can't wait to see you at The Busker."
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
