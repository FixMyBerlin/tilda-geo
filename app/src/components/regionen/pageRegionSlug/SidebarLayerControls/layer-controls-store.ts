import { create } from 'zustand'
import {
  type RegionMode,
  useOptimisticMode,
} from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { resolveLayerControlsOpen } from './resolveLayerControlsOpen'

/**
 * Desktop layer-controls chrome only (panel open vs collapsed to the layers button).
 * Per-mode user clicks live here for the session; mode itself is the route.
 * Layout auto-fold is tagged with the mode where the drag happened so it does not look
 * like a user close and does not follow the user into another mode.
 * Not URL state — ephemeral UI pref for the session.
 */
type LayerControlsStore = {
  userOpenByMode: Partial<Record<RegionMode, boolean>>
  layoutForcedClosedMode: RegionMode | null
  actions: {
    setOpenForMode: (mode: RegionMode, open: boolean) => void
    foldForLayout: (mode: RegionMode) => void
  }
}

const useLayerControlsStore = create<LayerControlsStore>()((set) => ({
  userOpenByMode: {},
  layoutForcedClosedMode: null,
  actions: {
    setOpenForMode: (mode, open) =>
      set((state) => {
        const layoutForcedClosedMode =
          state.layoutForcedClosedMode === mode ? null : state.layoutForcedClosedMode
        if (
          state.userOpenByMode[mode] === open &&
          state.layoutForcedClosedMode === layoutForcedClosedMode
        ) {
          return state
        }
        return {
          userOpenByMode: { ...state.userOpenByMode, [mode]: open },
          layoutForcedClosedMode,
        }
      }),
    foldForLayout: (mode) =>
      set((state) =>
        state.layoutForcedClosedMode === mode ? state : { layoutForcedClosedMode: mode },
      ),
  },
}))

export const getLayerControlsOpen = (mode: RegionMode) => {
  const { userOpenByMode, layoutForcedClosedMode } = useLayerControlsStore.getState()
  return resolveLayerControlsOpen({ mode, userOpenByMode, layoutForcedClosedMode })
}

/** Derived open state for the current (optimistic) mode. */
export const useLayerControlsOpen = () => {
  const mode = useOptimisticMode()
  const userOpenByMode = useLayerControlsStore((state) => state.userOpenByMode)
  const layoutForcedClosedMode = useLayerControlsStore((state) => state.layoutForcedClosedMode)
  return resolveLayerControlsOpen({ mode, userOpenByMode, layoutForcedClosedMode })
}

export const useLayerControlsActions = () => useLayerControlsStore((state) => state.actions)
