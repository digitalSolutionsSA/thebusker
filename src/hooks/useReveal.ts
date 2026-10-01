import { useCallback } from 'react'
import ScrollReveal from 'scrollreveal'

export type RevealOptions = scrollReveal.ScrollRevealObjectOptions

const defaults: RevealOptions = {
  distance: '40px',
  duration: 900,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  origin: 'bottom',
  opacity: 0,
  viewFactor: 0.15,
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Returns a callback ref that reveals the element as it scrolls into view.
 * Works for elements that mount late (e.g. after data loads) because React
 * calls the ref whenever the element attaches.
 *
 * Options are read once; change the element's `key` to re-run the animation.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options: RevealOptions = {}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(createRevealRef<T>(options), [])
}

/**
 * Like useReveal, but reveals each direct child of the element one after
 * another, `interval` ms apart. Use on grids and lists.
 */
export function useRevealChildren<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {},
  interval = 120,
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(createRevealRef<T>({ ...options, interval }, true), [])
}

function createRevealRef<T extends HTMLElement>(options: RevealOptions, children = false) {
  return (el: T | null) => {
    if (!el || prefersReducedMotion()) return

    const sr = ScrollReveal()
    const target = children ? el.querySelectorAll<HTMLElement>(':scope > *') : el
    const nodes: HTMLElement[] = children ? [...(target as NodeListOf<HTMLElement>)] : [el]

    // ScrollReveal never removes the inline styles it adds (sr.clean() only merges
    // `visibility: visible` back in). Leftover styles would block GSAP/hover transforms,
    // and a re-reveal (StrictMode's detach/re-attach) would read the hidden state as
    // the element's resting state — so we put the original inline styles back ourselves.
    const originalStyles = new Map(nodes.map((node) => [node, node.getAttribute('style')]))
    const restore = (node: HTMLElement) => {
      if (!originalStyles.has(node)) return
      const style = originalStyles.get(node)
      if (style == null) node.removeAttribute('style')
      else node.setAttribute('style', style)
    }

    sr.reveal(target, {
      ...defaults,
      ...options,
      afterReveal(node) {
        if (node instanceof HTMLElement) {
          sr.clean(node)
          restore(node)
        }
        options.afterReveal?.(node)
      },
    })

    return () => {
      sr.clean(target)
      nodes.forEach(restore)
    }
  }
}
