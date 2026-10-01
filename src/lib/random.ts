/** Deterministic pseudo-random generator, so procedural layouts look the same every render. */
export function createRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }
}
