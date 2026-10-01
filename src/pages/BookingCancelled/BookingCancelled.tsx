import StatusMessage from '../../sections/shared/StatusMessage'
import Button from '../../components/ui/Button'

export default function BookingCancelled() {
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
