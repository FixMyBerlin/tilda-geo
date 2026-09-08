import type { RegionMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'

/** Karte starts open; Hinweise, QA, and Prüflisten start closed. */
export const layerControlsOpenByDefault = (mode: RegionMode) => mode === 'map'

type ResolveLayerControlsOpenArgs = {
  mode: RegionMode
  userOpenByMode: Partial<Record<RegionMode, boolean>>
  layoutForcedClosed: boolean
}

/**
 * Layout auto-fold wins for the current mode visit. Otherwise use the user's click for this mode,
 * or the mode default when they have not decided yet.
 */
export const resolveLayerControlsOpen = ({
  mode,
  userOpenByMode,
  layoutForcedClosed,
}: ResolveLayerControlsOpenArgs) => {
  if (layoutForcedClosed) return false
  return userOpenByMode[mode] ?? layerControlsOpenByDefault(mode)
}
