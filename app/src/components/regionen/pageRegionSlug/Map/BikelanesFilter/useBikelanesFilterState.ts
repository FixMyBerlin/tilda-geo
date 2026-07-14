import { create } from 'zustand'

export type BikelanesWidthOperator = 'gt' | 'lt' | 'eq'

export type BikelanesWidthFilter = {
  operator: BikelanesWidthOperator
  value: number
}

// Prototype, session-only state (not URL-persisted) for the Radinfrastruktur filter pills.
// `*Deselected` sets only hold the *deselected* group ids, so "everything selected" (the
// default / no-filter state) is the empty set rather than needing every group id upfront.
type Store = {
  fuehrungsformDeselected: Set<string>
  oberflaecheDeselected: Set<string>
  widthFilter: BikelanesWidthFilter | null
  actions: {
    toggleFuehrungsform: (groupId: string) => void
    toggleOberflaeche: (groupId: string) => void
    setWidthFilter: (filter: BikelanesWidthFilter | null) => void
  }
}

const toggleInSet = (set_: Set<string>, id: string) => {
  const next = new Set(set_)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  return next
}

const useBikelanesFilterStore = create<Store>((set) => ({
  fuehrungsformDeselected: new Set(),
  oberflaecheDeselected: new Set(),
  widthFilter: null,
  actions: {
    toggleFuehrungsform: (groupId) =>
      set((state) => ({
        fuehrungsformDeselected: toggleInSet(state.fuehrungsformDeselected, groupId),
      })),
    toggleOberflaeche: (groupId) =>
      set((state) => ({
        oberflaecheDeselected: toggleInSet(state.oberflaecheDeselected, groupId),
      })),
    setWidthFilter: (widthFilter) => set({ widthFilter }),
  },
}))

export const useBikelanesFuehrungsformDeselected = () =>
  useBikelanesFilterStore((state) => state.fuehrungsformDeselected)
export const useBikelanesOberflaecheDeselected = () =>
  useBikelanesFilterStore((state) => state.oberflaecheDeselected)
export const useBikelanesWidthFilter = () => useBikelanesFilterStore((state) => state.widthFilter)
export const useBikelanesFilterActions = () => useBikelanesFilterStore((state) => state.actions)
