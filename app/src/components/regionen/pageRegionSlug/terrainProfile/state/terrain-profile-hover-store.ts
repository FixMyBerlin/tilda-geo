import { create } from 'zustand'
import { useShallow } from 'zustand/shallow'

type TerrainProfileHoverPoint = {
  featureKey: string
  index: number
  lng: number
  lat: number
  elevationMeters: number
  chartDistanceMeters: number
}

type TerrainProfileHoverStore = {
  hoverPoints: TerrainProfileHoverPoint[]
  hoverChartDistanceMeters: number | null
  actions: {
    setHoverSamples: (input: {
      chartDistanceMeters: number
      points: TerrainProfileHoverPoint[]
    }) => void
    clearHoverSample: () => void
  }
}

const useTerrainProfileHoverStore = create<TerrainProfileHoverStore>()((set) => ({
  hoverPoints: [],
  hoverChartDistanceMeters: null,
  actions: {
    setHoverSamples: ({ chartDistanceMeters, points }) =>
      set({
        hoverPoints: points,
        hoverChartDistanceMeters: chartDistanceMeters,
      }),
    clearHoverSample: () =>
      set({
        hoverPoints: [],
        hoverChartDistanceMeters: null,
      }),
  },
}))

export const useTerrainProfileHoverPoints = () =>
  useTerrainProfileHoverStore(useShallow((state) => state.hoverPoints))

export const useTerrainProfileHoverChartDistanceMeters = () =>
  useTerrainProfileHoverStore((state) => state.hoverChartDistanceMeters)

export const useTerrainProfileHoverActiveFeatureKeys = () =>
  useTerrainProfileHoverStore(
    useShallow((state) => state.hoverPoints.map((point) => point.featureKey)),
  )

export const useTerrainProfileHoverActions = () =>
  useTerrainProfileHoverStore((state) => state.actions)
