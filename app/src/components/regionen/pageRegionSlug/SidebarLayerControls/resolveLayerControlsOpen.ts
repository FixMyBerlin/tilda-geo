import type { RegionMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'

/** Karte starts open; Hinweise, QA, and Prüflisten start closed. */
export const layerControlsOpenByDefault = (mode: RegionMode) => mode === 'map'

type ResolveLayerControlsOpenArgs = {
  mode: RegionMode
  userOpenByMode: Partial<Record<RegionMode, boolean>>
  layoutForcedClosedMode: RegionMode | null
}

/**
 * Layout auto-fold wins only for the mode where the panel was dragged. Switching mode therefore
 * un-folds the destination. Otherwise use the user's click for this mode, or the mode default.
 */
export const resolveLayerControlsOpen = ({
  mode,
  userOpenByMode,
  layoutForcedClosedMode,
}: ResolveLayerControlsOpenArgs) => {
  if (layoutForcedClosedMode === mode) return false
  return userOpenByMode[mode] ?? layerControlsOpenByDefault(mode)
}
