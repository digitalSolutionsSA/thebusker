import type { HeroScene, HeroSlideImage } from './HeroScene'

/** What hero sections use; calls made before the scene has loaded are queued or dropped safely */
export interface HeroSceneHandle {
  goTo(index: number): void
  intro(): void
  dispose(): void
}

/**
 * Starts a HeroScene without putting Three.js (~180 kB gzipped) on the page's critical path:
 * the hero text renders at once, and the WebGL photo fades in when the module and first photo arrive.
 */
export function createHeroScene(canvas: HTMLCanvasElement, images: HeroSlideImage[], onReady?: () => void): HeroSceneHandle {
  let scene: HeroScene | null = null
  let disposed = false
  let introQueued = false

  import('./HeroScene')
    .then(({ HeroScene }) => {
      if (disposed) return
      scene = new HeroScene(canvas, images, onReady)
      if (introQueued) scene.intro()
    })
    // If the module can't load, don't hold up the preloader
    .catch(() => onReady?.())

  return {
    goTo: (i) => scene?.goTo(i),
    intro: () => (scene ? scene.intro() : void (introQueued = true)),
    dispose: () => {
      disposed = true
      scene?.dispose()
    },
  }
}
