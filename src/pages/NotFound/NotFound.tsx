import StatusMessage from '../../sections/shared/StatusMessage'
import Button from '../../components/ui/Button'

export default function NotFound() {
  return (
    <StatusMessage
      eyebrow="404"
      title="Wrong stage door"
      body="The page you're looking for isn't here. Let's get you back to the show."
      actions={
        <>
          <Button to="/">Back home</Button>
          <Button to="/shows" variant="outline">
            Upcoming shows
          </Button>
        </>
      }
    />
  )
}
