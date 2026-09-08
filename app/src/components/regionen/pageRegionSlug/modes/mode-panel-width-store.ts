import { create } from 'zustand'
import { MODE_PANEL_WIDTH_DEFAULT, readModePanelWidth } from './modePanelWidthStorage'

type ModePanelWidthStore = {
  width: number
  isDragging: boolean
  actions: {
    resize: (width: number) => void
    startDrag: () => void
    endDrag: () => void
    resetFromStorage: () => void
  }
}

const initialWidth = () => {
  if (typeof window === 'undefined') return MODE_PANEL_WIDTH_DEFAULT
  try {
    return readModePanelWidth()
  } catch {
    return MODE_PANEL_WIDTH_DEFAULT
  }
}

const useModePanelWidthStore = create<ModePanelWidthStore>()((set) => ({
  width: initialWidth(),
  isDragging: false,
  actions: {
    resize: (width) => set((state) => (state.width === width ? state : { width })),
    startDrag: () => set((state) => (state.isDragging ? state : { isDragging: true })),
    endDrag: () => set((state) => (state.isDragging ? { isDragging: false } : state)),
    resetFromStorage: () =>
      set((state) => {
        const width = readModePanelWidth()
        return state.width === width ? state : { width }
      }),
  },
}))

export const useModePanelWidth = () => useModePanelWidthStore((state) => state.width)

export const useModePanelWidthDragging = () => useModePanelWidthStore((state) => state.isDragging)

export const useModePanelWidthActions = () => useModePanelWidthStore((state) => state.actions)
