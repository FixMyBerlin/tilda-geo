import { create } from 'zustand'

/**
 * Shared hover state for the mode list and map. Hovering a row stores the row's `[lng, lat]` so
 * `MapListHoverMarker` can place a ring from the current viewport alone — the map feature does
 * not need to be loaded. Off-screen items get an edge ring; in-view items get the same ring on
 * the point. Map clicks use existing selection params. The list reacts to those.
 */
type HoveredListItem = {
  id: string
  coordinates: [number, number]
}

type ModeListStore = {
  hoveredListItem: HoveredListItem | null
  /** Bumped from <Map onMove/onResize> so the list-hover marker can re-project without map.on(). */
  mapViewEpoch: number
  actions: {
    hoverListItem: (item: HoveredListItem) => void
    unhoverListItem: (id: string) => void
    notifyMapViewChanged: () => void
  }
}

const useModeListStore = create<ModeListStore>()((set) => ({
  hoveredListItem: null,
  mapViewEpoch: 0,
  actions: {
    hoverListItem: (item) =>
      set((state) => (state.hoveredListItem?.id === item.id ? state : { hoveredListItem: item })),
    // Only clear if the given item is still the hovered one (mouseleave can fire after the
    // mouseenter of the next item)
    unhoverListItem: (id) =>
      set((state) => (state.hoveredListItem?.id === id ? { hoveredListItem: null } : state)),
    notifyMapViewChanged: () =>
      set((state) => (state.hoveredListItem ? { mapViewEpoch: state.mapViewEpoch + 1 } : state)),
  },
}))

export const useHoveredListItem = () => useModeListStore((state) => state.hoveredListItem)
export const useModeListActions = () => useModeListStore((state) => state.actions)
/** Camera ticks while a list item is hovered; 0 otherwise so unused pans skip re-renders. */
export const useHoveredMapViewEpoch = () =>
  useModeListStore((state) => (state.hoveredListItem ? state.mapViewEpoch : 0))
