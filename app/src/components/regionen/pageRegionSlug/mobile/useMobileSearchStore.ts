import { create } from 'zustand'

type SearchControlHandle = {
  focus: () => void
  blur: () => void
}

type MobileSearchStore = {
  /** Whether the mobile search input is revealed. */
  open: boolean
  /** focus()/blur() bridge to the (map-mounted) geocoding control, or null until registered. */
  control: SearchControlHandle | null
  setOpen: (open: boolean) => void
  setControl: (control: SearchControlHandle | null) => void
}

/**
 * Shared state bridging the mobile search button (in MobileMapHeader) and the
 * geocoding control (mounted on the map in SearchControl.client). The button
 * lives outside the map subtree, so it reaches the control's focus()/blur() here.
 */
export const useMobileSearchStore = create<MobileSearchStore>((set) => ({
  open: false,
  control: null,
  setOpen: (open) => set({ open }),
  setControl: (control) => set({ control }),
}))
