import { create } from 'zustand'

/**
 * Shared hover state for the mode list and map. Two channels, so they cannot echo each other:
 * - List → map: `{ id, coordinates }` for `MapListHoverMarker` / highlight paint. Off-screen items
 *   get an edge ring; in-view notes, QA, and Prüflisten paint the same highlight as selection.
 * - Map → list: mode-prefixed row id only. Rows apply the hover background; this never carries
 *   coordinates, so it cannot light the centroid ring.
 * Map clicks use existing selection params. The list reacts to those.
 */
type HoveredListItem = {
  id: string
  coordinates: [number, number]
}

type ModeListStore = {
  hoveredListItem: HoveredListItem | null
  hoveredMapItemId: string | null
  /** Bumped from <Map onMove/onResize> so the list-hover marker can re-project without map.on(). */
  mapViewEpoch: number
  actions: {
    hoverListItem: (item: HoveredListItem) => void
    unhoverListItem: (id: string) => void
    /** Drop list→map hover (e.g. after a map click so a stale disc does not linger). */
    clearHoveredListItem: () => void
    hoverMapItem: (id: string) => void
    clearHoveredMapItem: () => void
    notifyMapViewChanged: () => void
  }
}

const useModeListStore = create<ModeListStore>()((set) => ({
  hoveredListItem: null,
  hoveredMapItemId: null,
  mapViewEpoch: 0,
  actions: {
    hoverListItem: (item) =>
      set((state) => (state.hoveredListItem?.id === item.id ? state : { hoveredListItem: item })),
    // Only clear if the given item is still the hovered one (mouseleave can fire after the
    // mouseenter of the next item)
    unhoverListItem: (id) =>
      set((state) => (state.hoveredListItem?.id === id ? { hoveredListItem: null } : state)),
    clearHoveredListItem: () => set({ hoveredListItem: null }),
    hoverMapItem: (id) =>
      set((state) => (state.hoveredMapItemId === id ? state : { hoveredMapItemId: id })),
    clearHoveredMapItem: () =>
      set((state) => (state.hoveredMapItemId === null ? state : { hoveredMapItemId: null })),
    notifyMapViewChanged: () =>
      set((state) => (state.hoveredListItem ? { mapViewEpoch: state.mapViewEpoch + 1 } : state)),
  },
}))

export const useHoveredListItem = () => useModeListStore((state) => state.hoveredListItem)
export const useHoveredMapItemId = () => useModeListStore((state) => state.hoveredMapItemId)
export const useIsHoveredMapListItem = (id: string) =>
  useModeListStore((state) => state.hoveredMapItemId === id)
export const useModeListActions = () => useModeListStore((state) => state.actions)
/** Camera ticks while a list item is hovered; 0 otherwise so unused pans skip re-renders. */
export const useHoveredMapViewEpoch = () =>
  useModeListStore((state) => (state.hoveredListItem ? state.mapViewEpoch : 0))
