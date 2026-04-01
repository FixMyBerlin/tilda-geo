/**
 * Playwright E2E testing utilities.
 * These helpers only activate when VITE_PLAYWRIGHT_ENABLED is set to 'true'.
 *
 * See app/tests/README.md for setup and usage.
 */

import { createIsomorphicFn } from '@tanstack/react-start'

declare global {
  interface Window {
    __PLAYWRIGHT_ENABLED?: 'true'
    __mapLoaded?: boolean
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
 * Fires a custom 'mapLoaded' event for Playwright E2E testing.
 * Only fires when VITE_PLAYWRIGHT_ENABLED is set to 'true'.
 */
export const firePlaywrightMapLoadedEvent = createIsomorphicFn()
  .server(() => {})
  .client(() => {
    const enabled =
      import.meta.env.VITE_PLAYWRIGHT_ENABLED === 'true' || window.__PLAYWRIGHT_ENABLED === 'true'
    if (!enabled) return
    window.dispatchEvent(new CustomEvent('mapLoaded'))
    window.__mapLoaded = true
  })
