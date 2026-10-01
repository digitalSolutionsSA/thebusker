import { useState } from 'react'
import { Camera } from 'lucide-react'
import { galleryImages, type GalleryTag } from '../../../data/gallery'
import { useSectionReveal } from '../../../hooks/useSectionReveal'
import SectionHeading from '../../../components/ui/SectionHeading'
import Lightbox from '../../../components/gallery/Lightbox'

interface Props {
  /** limit to one page's photos; omit to show everything */
  tag?: GalleryTag
  eyebrow?: string
  title?: string
  subtitle?: string
  tone?: 'ember' | 'bok'
  limit?: number
}

// Repeating editorial rhythm: some tiles span two rows/columns
const spans = ['md:row-span-2', '', 'md:col-span-2', '', 'md:row-span-2', '', '', 'md:col-span-2']

const placeholderShades = {
  ember: ['#5a3214', '#2a1a0c', '#8a6a24', '#1f1710', '#3e2410', '#17110b'],
  bok: ['#0b3d24', '#04140b', '#1c8a4a', '#0b2a19', '#14532d', '#04140b'],
}

export default function GallerySection({
  tag,
  eyebrow = 'Gallery',
  title = 'Moments at The Busker',
  subtitle,
  tone = 'ember',
  limit,
}: Props) {
  const [open, setOpen] = useState<number | null>(null)
  const images = galleryImages
    .filter((img) => !tag || img.tags.includes(tag) || img.tags.includes('venue'))
    .slice(0, limit)
  const root = useSectionReveal<HTMLElement>()
  const wipes = ['up', 'left', 'right', 'down']

  return (
    <section ref={root} className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} tone={tone === 'bok' ? 'bok' : 'ember'} />

      {images.length === 0 ? (
        <div data-stagger className="grid grid-flow-row-dense auto-rows-[11rem] grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {spans.slice(0, 6).map((span, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl border border-white/8 grain ${span}`}
              style={{
                background: `radial-gradient(120% 100% at ${i % 2 ? '0% 0%' : '100% 100%'}, ${placeholderShades[tone][i]}, #0f0b07)`,
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ivory/30">
                <Camera size={26} strokeWidth={1.25} />
                {i === 0 && <span className="eyebrow text-[0.6rem]">Photos coming soon</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-flow-row-dense auto-rows-[12rem] grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setOpen(i)}
              data-wipe={wipes[i % wipes.length]}
              data-cursor="View"
              className={`group relative overflow-hidden rounded-2xl border border-white/8 ${spans[i % spans.length]}`}
              aria-label={`Open photo: ${img.alt}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[var(--ease-luxe)] group-hover:scale-110"
              />
              <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-gold/0 transition-[box-shadow] duration-500 group-hover:ring-gold/60" />
              <span className="absolute inset-0 flex items-end bg-gradient-to-t from-night/80 via-transparent p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-ivory opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                {img.alt}
              </span>
            </button>
          ))}
        </div>
      )}

      {open !== null && <Lightbox images={images} index={open} onClose={() => setOpen(null)} onNavigate={setOpen} />}
    </section>
  )
}
