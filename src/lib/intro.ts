// Coordinates the preloader with the first page:
//  - heavy assets (e.g. hero WebGL textures) register while loading, so the curtain waits for them
//  - hero animations wait for the curtain to lift before they play

let resolveIntro: () => void = () => {}

export const introReady = new Promise<void>((resolve) => {
  resolveIntro = resolve
})

export const markIntroDone = () => resolveIntro()

let pending = 0
const listeners = new Set<() => void>()

/** Call while something important loads; call the returned function when it's ready. */
export function registerAsset() {
  pending++
  let done = false
  return () => {
    if (done) return
    done = true
    pending--
    if (pending <= 0) listeners.forEach((fn) => fn())
  }
}

/** Resolves once nothing registered is still loading (or after `timeoutMs`). */
export function assetsSettled(timeoutMs = 4500) {
  return new Promise<void>((resolve) => {
    if (pending <= 0) return resolve()
    const finish = () => {
      listeners.delete(finish)
      resolve()
    }
    listeners.add(finish)
    setTimeout(finish, timeoutMs)
  })
}
