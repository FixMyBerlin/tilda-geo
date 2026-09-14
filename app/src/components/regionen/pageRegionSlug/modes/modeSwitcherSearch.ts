import type { RegionMode } from './useCurrentMode'

/**
 * Notes compose (`notes.new`) is cleared by ModeScopedSelectionReset when leaving Hinweise,
 * matching review (`review.new`). The switcher does not strip mode JSON.
 */
export const modeSwitcherSearch = <T extends Record<string, unknown>>(_mode: RegionMode, prev: T) =>
  prev
