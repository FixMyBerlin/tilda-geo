import { create } from 'zustand'
import {
  type RegionMode,
  useOptimisticMode,
} from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import { resolveLayerControlsOpen } from './resolveLayerControlsOpen'

/**
 * Desktop layer-controls chrome only (panel open vs collapsed to the layers button).
 * Per-mode user clicks live here for the session; mode itself is the route.
 * Layout auto-fold is separate so it does not look like a user close.
 * Not URL state — ephemeral UI pref for the session.
 */
type LayerControlsStore = {
  userOpenByMode: Partial<Record<RegionMode, boolean>>
  layoutForcedClosed: boolean
  actions: {
    setOpenForMode: (mode: RegionMode, open: boolean) => void
    foldForLayout: () => void
    clearLayoutFold: () => void
  }
}

const useLayerControlsStore = create<LayerControlsStore>()((set) => ({
  userOpenByMode: {},
  layoutForcedClosed: false,
  actions: {
    setOpenForMode: (mode, open) =>
      set((state) => {
        if (state.userOpenByMode[mode] === open && !state.layoutForcedClosed) return state
        return {
          userOpenByMode: { ...state.userOpenByMode, [mode]: open },
          layoutForcedClosed: false,
        }
      }),
    foldForLayout: () =>
      set((state) => (state.layoutForcedClosed ? state : { layoutForcedClosed: true })),
    clearLayoutFold: () =>
      set((state) => (state.layoutForcedClosed ? { layoutForcedClosed: false } : state)),
  },
}))

/** Derived open state for the current (optimistic) mode. */
export const useLayerControlsOpen = () => {
  const mode = useOptimisticMode()
  const userOpenByMode = useLayerControlsStore((state) => state.userOpenByMode)
  const layoutForcedClosed = useLayerControlsStore((state) => state.layoutForcedClosed)
  return resolveLayerControlsOpen({ mode, userOpenByMode, layoutForcedClosed })
}

export const useLayerControlsActions = () => useLayerControlsStore((state) => state.actions)
