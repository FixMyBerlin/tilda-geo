import type { RegionMode } from './useCurrentMode'

/**
 * Mode switcher links keep the previous search object. Mode-scoped keys (`notes.new`,
 * `review.new` / `review.move`, mode-owned `f` features) are stripped by each mode route's
 * `search.middlewares`.
 */
export const modeSwitcherSearch = <T extends Record<string, unknown>>(_mode: RegionMode, prev: T) =>
  prev
