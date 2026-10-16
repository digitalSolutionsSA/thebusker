import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { GLImageOptions } from './GLImage'

interface Props extends GLImageOptions {
  src: string
  alt: string
  className?: string
  /** Overlay content (text, gradients) drawn above the photo */
  children?: ReactNode
  /** Label shown in the custom cursor disc on hover */
  cursor?: string
}

/**
 * The WebGL effects (ripple, pointer light) only respond to a mouse, so phones, tablets and small
 * screens get the plain photo: no Three.js download, no GPU work, no extra WebGL contexts.
 */
const wantsWebGL = () =>
  typeof window !== 'undefined' &&
  matchMedia('(pointer: fine) and (hover: hover) and (min-width: 1024px)').matches &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Photo that shows immediately as a normal lazy-loaded image. On desktop, the WebGL version
 * (GLImage) is created when the photo nears the viewport and fades in over it once ready.
 */
export default function GLPhoto({ src, alt, className = '', children, cursor, focus, tint }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [glReady, setGlReady] = useState(false)
  const [webgl] = useState(wantsWebGL)

  useEffect(() => {
    const el = host.current
    if (!webgl || !el || !canvas.current) return
    let gl: { dispose(): void } | null = null
    let disposed = false

    const start = () => {
      import('./GLImage').then(({ GLImage }) => {
        if (disposed || !canvas.current) return
        gl = new GLImage(canvas.current, el, src, { focus, tint }, () => !disposed && setGlReady(true))
      })
    }
    // Start a screen or so before the photo scrolls in, so it's ready (and can wipe in) on arrival
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        start()
      },
      { rootMargin: '600px 0px' },
    )
    io.observe(el)

    return () => {
      disposed = true
      io.disconnect()
      gl?.dispose()
      setGlReady(false)
    }
    // focus/tint are read once on creation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, webgl])

  const [fx, fy] = focus ?? [0.5, 0.5]

  return (
    <div
      ref={host}
      className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} overflow-hidden bg-night ${className}`}
      data-cursor={cursor}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        // the shader's focus is measured from the bottom; object-position from the top
        style={{ objectPosition: `${fx * 100}% ${(1 - fy) * 100}%` }}
      />
      {webgl && (
        <canvas
          ref={canvas}
          aria-hidden
          className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${glReady ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
      {children}
    </div>
  )
}
