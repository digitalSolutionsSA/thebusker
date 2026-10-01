import { useEffect, useRef, type ReactNode } from 'react'
import { GLImage, type GLImageOptions } from './GLImage'

interface Props extends GLImageOptions {
  src: string
  alt: string
  className?: string
  /** Overlay content (text, gradients) drawn above the WebGL canvas */
  children?: ReactNode
  /** Label shown in the custom cursor disc on hover */
  cursor?: string
}

/** React wrapper around GLImage: the canvas fills this element; children sit on top. */
export default function GLPhoto({ src, alt, className = '', children, cursor, focus, tint }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!host.current || !canvas.current) return
    const gl = new GLImage(canvas.current, host.current, src, { focus, tint })
    return () => gl.dispose()
    // focus/tint are read once on creation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  return (
    <div
      ref={host}
      className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} overflow-hidden bg-night ${className}`}
      data-cursor={cursor}
    >
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" role="img" aria-label={alt} />
      {children}
    </div>
  )
}
