import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { GalleryImage } from '../../../data/gallery'
import { gsap, useGSAP } from '../../../lib/gsap'

interface Props {
  images: GalleryImage[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export default function Lightbox({ images, index, onClose, onNavigate }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const image = images[index]
  const prev = () => onNavigate((index - 1 + images.length) % images.length)
  const next = () => onNavigate((index + 1) % images.length)

  useGSAP(() => {
    gsap.from(root.current, { opacity: 0, duration: 0.4, ease: 'power2.out' })
  })

  useGSAP(
    () => {
      gsap.fromTo('[data-lightbox-img]', { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' })
    },
    { scope: root, dependencies: [index] },
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  })

  const navBtn = 'grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-black/40 text-ivory backdrop-blur hover:bg-white/10'

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-night/95 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <img
        data-lightbox-img
        src={image.src}
        alt={image.alt}
        className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <button type="button" className={`${navBtn} absolute right-5 top-5`} onClick={onClose} aria-label="Close">
        <X size={20} />
      </button>
      {images.length > 1 && (
        <>
          <button type="button" className={`${navBtn} absolute left-4 top-1/2 -translate-y-1/2`} onClick={(e) => (e.stopPropagation(), prev())} aria-label="Previous photo">
            <ChevronLeft size={20} />
          </button>
          <button type="button" className={`${navBtn} absolute right-4 top-1/2 -translate-y-1/2`} onClick={(e) => (e.stopPropagation(), next())} aria-label="Next photo">
            <ChevronRight size={20} />
          </button>
        </>
      )}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-mist">
        {index + 1} / {images.length}
      </p>
    </div>
  )
}
