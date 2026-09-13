import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import type { RegionMode } from './useCurrentMode'

/**
 * Compose is Hinweise-only; strip create params when leaving so the map unlocks.
 * Shared by the desktop header switcher and the mobile mode menu.
 */
export const modeSwitcherSearch = <T extends Record<string, unknown>>(
  mode: RegionMode,
  prev: T,
) => {
  if (mode === 'notes') return prev
  if (
    prev[searchParamsRegistry.osmNote] === undefined &&
    prev[searchParamsRegistry.internalNote] === undefined
  ) {
    return prev
  }
  const next = { ...prev }
  delete next[searchParamsRegistry.osmNote]
  delete next[searchParamsRegistry.internalNote]
  return next
}
