import { galleryImages } from '../data/gallery'

interface Props {
  tag: 'bok-town' | 'shows'
  title?: string
  subtitle?: string
  variant?: 'brass' | 'bok-gold'
}

export default function Gallery({ tag, title = 'Gallery', subtitle, variant = 'brass' }: Props) {
  const images = galleryImages.filter((img) => img.tags.includes(tag) || img.tags.includes('venue'))
  const accent = variant === 'bok-gold' ? 'text-bok-gold' : 'text-brass-light'
  const border = variant === 'bok-gold' ? 'border-bok-gold/20 hover:border-bok-gold/50' : 'border-brass/20 hover:border-brass/50'

  return (
    <section className="py-24 bg-ink">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className={`uppercase tracking-[0.5em] text-xs mb-4 ${accent}`}>Gallery</p>
          <h2 className="font-display text-4xl text-cream mb-3">{title}</h2>
          {subtitle && <p className="text-cream/60 max-w-xl mx-auto">{subtitle}</p>}
        </div>

        {images.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-xl border ${border} bg-cream/[0.03] flex items-center justify-center transition-colors`}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-cream/15"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="9" cy="10" r="2" />
                  <path d="M21 16l-5-5-4 4-3-3-6 6" />
                </svg>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className={`aspect-square rounded-xl overflow-hidden border ${border} transition-colors`}
              >
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
