import { site } from '../../../config/site'

interface Props {
  /** `light` = white logo for dark backgrounds, `dark` = black logo for light backgrounds */
  variant?: 'light' | 'dark'
  className?: string
  eager?: boolean
}

export default function Logo({ variant = 'light', className = '', eager = false }: Props) {
  const src = variant === 'light' ? site.logo.light : site.logo.dark
  return (
    <img
      src={src}
      alt={`${site.name} — ${site.tagline}`}
      width={900}
      height={449}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      className={`h-auto select-none ${className}`}
    />
  )
}
