import BokTown from '../components/BokTown'
import Gallery from '../components/Gallery'

export default function BokTownPage() {
  return (
    <div className="pt-20">
      <BokTown />
      <Gallery
        tag="bok-town"
        title="Match Day Moments"
        subtitle="A look back at the sea of green and gold on previous Springbok match days."
        variant="bok-gold"
      />
    </div>
  )
}
