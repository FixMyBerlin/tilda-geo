import { useEffect } from 'react'
import { isBrowser } from '@/components/shared/utils/isEnv'

/**
 * Writes the *visible* viewport height (in px) into the `--app-height` CSS variable on the root
 * element, so full-bleed routes can size to it via `h-[var(--app-height,100dvh)]` instead of a
 * raw viewport unit.
 *
 * Why JS instead of `100dvh`/`100svh`: Chrome and Firefox on iOS never implemented the
 * `minimumViewportInset`/`maximumViewportInset` APIs that `svh`/`dvh` rely on, so those units
 * recalculate against the wrong viewport and the map grows/shrinks as the URL bar animates
 * (WebKit bug 242758). Reading the height in JS is the reliable cross-browser fix. `100dvh` stays
 * as the CSS fallback for SSR / the first paint before this effect runs.
 *
 * Why `window.innerHeight` and not `visualViewport.height`: the visual viewport shrinks when the
 * on-screen keyboard opens, which would make the map jump every time the place-search input is
 * focused. `innerHeight` tracks the URL-bar show/hide but ignores the keyboard overlay on iOS —
 * the correct behaviour for a full-page map. We still listen to `visualViewport` resize as an
 * extra trigger (toolbar animations don't always fire a window `resize`), but always *read*
 * `innerHeight`.
 *
 * Pass `enabled = false` on routes that scroll normally (the var is only consumed by full-bleed
 * wrappers) to avoid attaching listeners where they're not needed.
 */
export function useVisibleViewportHeightVar(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !isBrowser) return

    const root = document.documentElement
    const update = () => {
      root.style.setProperty('--app-height', `${window.innerHeight}px`)
    }
    update()

    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    window.visualViewport?.addEventListener('resize', update)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      window.visualViewport?.removeEventListener('resize', update)
      root.style.removeProperty('--app-height')
    }
  }, [enabled])
}
