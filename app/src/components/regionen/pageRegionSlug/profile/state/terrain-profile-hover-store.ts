import { create } from 'zustand'

type TerrainProfileHoverStore = {
  hoverSampleIndex: number | null
  actions: {
    setHoverSampleIndex: (index: number | null) => void
    clearHoverSampleIndex: () => void
  }
}

const useTerrainProfileHoverStore = create<TerrainProfileHoverStore>()((set) => ({
  hoverSampleIndex: null,
  actions: {
    setHoverSampleIndex: (index) => set({ hoverSampleIndex: index }),
    clearHoverSampleIndex: () => set({ hoverSampleIndex: null }),
  },
}))

export const useTerrainProfileHoverSampleIndex = () =>
  useTerrainProfileHoverStore((state) => state.hoverSampleIndex)

export const useTerrainProfileHoverActions = () =>
  useTerrainProfileHoverStore((state) => state.actions)
