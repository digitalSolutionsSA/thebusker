import { gsap } from '../../../lib/gsap'
import type { HeroScene, HeroSlideImage } from './HeroScene'

/** What hero sections use; calls made before the scene has loaded are queued or dropped safely */
export interface HeroSceneHandle {
  goTo(index: number): void
  intro(): void
  dispose(): void
}

/**
 * The smoky WebGL wipe is a desktop flourish: phones and tablets get the same photos as plain images
 * that crossfade, so they never download Three.js (~180 kB gzipped) or run a full-screen shader.
 * Save-Data visitors get the light version too.
 */
const wantsWebGL = () =>
  matchMedia('(pointer: fine) and (min-width: 1024px)').matches &&
  !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData

// Same zoom values as the shader, so both versions move alike
const REST_ZOOM = 1.04
const ENTER_ZOOM = 1.14

/**
 * Starts a hero photo slideshow without putting Three.js on the page's critical path. The first photo
 * shows at once as a normal image in a layer under the canvas (it is also what releases the preloader);
 * on desktop the WebGL scene loads behind it and fades in over it when ready.
 */
export function createHeroScene(canvas: HTMLCanvasElement, images: HeroSlideImage[], onReady?: () => void): HeroSceneHandle {
  let scene: HeroScene | null = null
  let disposed = false
  let introQueued = false
  const webgl = wantsWebGL()

  // Photo layer: sits where the canvas is, under it, and picks up the same scroll parallax (the
  // sections target the canvas by its data-* attribute, so the layer copies those)
  const layer = document.createElement('div')
  layer.className = canvas.className
  layer.setAttribute('aria-hidden', 'true')
  layer.style.overflow = 'hidden'
  for (const { name, value } of Array.from(canvas.attributes)) if (name.startsWith('data-')) layer.setAttribute(name, value)
  canvas.before(layer)
  if (!webgl) canvas.style.display = 'none'

  // Wide screens: like the shader, the photo sits right and melts into darkness behind the headline
  const wide = () => layer.clientWidth / Math.max(1, layer.clientHeight) > 1.2
  const imgs: HTMLImageElement[] = []
  let current = 0

  const addImage = (i: number) => {
    const { src, focusX, dim = 1 } = images[i]
    const img = new Image()
    img.alt = ''
    img.decoding = 'async'
    if (i === 0) img.fetchPriority = 'high'
    img.src = src
    Object.assign(img.style, {
      position: 'absolute',
      top: '0',
      height: '100%',
      objectFit: 'cover',
      objectPosition: `${focusX * 100}% 50%`,
      // approximates the shader's warm whisky grade
      filter: `brightness(${dim * 0.92}) sepia(0.28) saturate(0.85)`,
      opacity: i === 0 ? '1' : '0',
      transition: 'opacity 1.6s ease-in-out',
      transform: `scale(${REST_ZOOM})`,
      willChange: 'opacity, transform',
    })
    frame(img)
    layer.append(img)
    imgs[i] = img
    return img
  }

  const frame = (img: HTMLImageElement) => {
    const w = wide()
    img.style.left = w ? '20%' : '0'
    img.style.width = w ? '80%' : '100%'
    const mask = w ? 'linear-gradient(to right, transparent, #000 55%)' : ''
    img.style.maskImage = mask
    img.style.setProperty('-webkit-mask-image', mask)
  }
  const onResize = () => imgs.forEach((img) => img && frame(img))
  window.addEventListener('resize', onResize)

  let readyCalled = false
  const ready = () => {
    if (readyCalled) return
    readyCalled = true
    onReady?.()
  }

  const first = addImage(0)
  const firstLoaded = () => {
    ready()
    // The other slides follow once the first is up, so they don't compete with it for bandwidth
    if (!webgl && !disposed) for (let k = 1; k < images.length; k++) addImage(k)
  }
  if (first.complete && first.naturalWidth) firstLoaded()
  else {
    first.addEventListener('load', firstLoaded, { once: true })
    first.addEventListener('error', ready, { once: true })
  }

  if (webgl) {
    import('./HeroScene')
      .then(({ HeroScene }) => {
        if (disposed) return
        // The canvas fades in over the photo; the photo layer goes once it's covered
        scene = new HeroScene(canvas, images, () => {
          window.setTimeout(() => !disposed && layer.remove(), 1200)
        })
        if (introQueued) scene.intro()
      })
      // Without WebGL the photo layer simply stays
      .catch(() => {})
  }

  const zoomIn = (img: HTMLImageElement | undefined, from: number, duration: number) => {
    if (img) gsap.fromTo(img, { scale: from }, { scale: REST_ZOOM, duration, ease: 'expo.out', overwrite: 'auto' })
  }

  return {
    goTo: (i) => {
      if (scene) return scene.goTo(i)
      if (webgl || i === current || !imgs[i]?.complete) return
      imgs[current].style.opacity = '0'
      imgs[i].style.opacity = '1'
      current = i
      gsap.fromTo(imgs[i], { scale: ENTER_ZOOM }, { scale: REST_ZOOM, duration: 7, ease: 'power2.out', overwrite: 'auto' })
    },
    intro: () => {
      if (scene) return scene.intro()
      if (webgl) introQueued = true
      zoomIn(imgs[current], 1.35, 3.4)
    },
    dispose: () => {
      disposed = true
      window.removeEventListener('resize', onResize)
      gsap.killTweensOf(imgs)
      layer.remove()
      canvas.style.display = ''
      scene?.dispose()
    },
  }
}
