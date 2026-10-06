import { additionalSourceKeys } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/url'
import type { RegionMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'

const [osmNotesSourceId, internalNotesSourceId, reviewEntriesSourceId, qaSourceId] =
  additionalSourceKeys

/**
 * Map sources that exist only inside one mode. Leaving that mode must drop those features from the
 * inspector and the URL `f` param. Their layers unmount, so a leftover selection would show a
 * stale inspector with nothing on the map.
 *
 * Notes (OSM + internal) are Hinweise-only — not a default-map overlay.
 * Source ids are the `additionalSourceKeys` string literals so this module does not import map
 * layers (those layers import feature-param hooks that would cycle back here).
 */
const modeScopedSourceModes = {
  [osmNotesSourceId]: 'notes',
  [internalNotesSourceId]: 'notes',
  [reviewEntriesSourceId]: 'reviewLists',
  [qaSourceId]: 'qa',
} as const satisfies Record<string, RegionMode>

export const modeForSource = (sourceId: string) =>
  (modeScopedSourceModes as Record<string, RegionMode>)[sourceId]

export const isModeOwnedSource = (sourceId: string) => modeForSource(sourceId) !== undefined

export const isSelectionSourceAllowedInMode = (sourceId: string, mode: RegionMode) => {
  const requiredMode = modeForSource(sourceId)
  if (!requiredMode) return true
  return requiredMode === mode
}

export const filterInspectorFeaturesForMode = <T extends { source: string }>(
  features: T[],
  mode: RegionMode,
) => features.filter((feature) => isSelectionSourceAllowedInMode(feature.source, mode))

export const filterUrlFeaturesForMode = <T extends { sourceId: string }>(
  features: T[],
  mode: RegionMode,
) => features.filter((feature) => isSelectionSourceAllowedInMode(feature.sourceId, mode))
