/**
 * Browser test and agent-debugging utilities.
 *
 * See app/tests/README.md for setup and usage.
 */

import { createIsomorphicFn } from '@tanstack/react-start'
import type { Map as MaplibreMap } from 'maplibre-gl'

declare global {
  interface Window {
    __PLAYWRIGHT_ENABLED?: 'true'
    __mapLoaded?: boolean
    // The main map instance, for tests and agent tooling to inspect runtime state
    // like `getStyle().layers` (layer order). Set in dev and Playwright mode.
    __mainMap?: MaplibreMap
  }
}

/**
 * Returns a data-testid value only when running in Playwright E2E tests.
 * Returns undefined otherwise to avoid polluting production HTML.
 *
 * Works on both server and client render.
 *
 * Usage:
 *   <div {...playwrightTestId('my-component')}>Content</div>
 *   <Menu data-testid={playwrightTestId('user-info')}>...</Menu>
 */
export function playwrightTestId(testId: string) {
  const enabled = import.meta.env.VITE_PLAYWRIGHT_ENABLED === 'true'
  return enabled ? testId : undefined
}

/**
 * Exposes the map instance as `window.__mainMap` in dev/Playwright mode so tests
 * and agent tooling can inspect runtime state, e.g. layer order via
 * `window.__mainMap.getStyle().layers`.
 */
export const exposeMainMapForDebugging = createIsomorphicFn()
  .server((_map?: MaplibreMap) => {})
  .client((map?: MaplibreMap) => {
    const playwrightEnabled =
      import.meta.env.VITE_PLAYWRIGHT_ENABLED === 'true' || window.__PLAYWRIGHT_ENABLED === 'true'
    if (import.meta.env.DEV || playwrightEnabled) {
      window.__mainMap = map
    }
  })

/**
 * Fires a custom 'mapLoaded' event for Playwright E2E testing.
 * Only active when VITE_PLAYWRIGHT_ENABLED is set to 'true'.
 */
export const firePlaywrightMapLoadedEvent = createIsomorphicFn()
  .server(() => {})
  .client(() => {
    const playwrightEnabled =
      import.meta.env.VITE_PLAYWRIGHT_ENABLED === 'true' || window.__PLAYWRIGHT_ENABLED === 'true'
    if (!playwrightEnabled) return
    window.dispatchEvent(new CustomEvent('mapLoaded'))
    window.__mapLoaded = true
  })
