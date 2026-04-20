import type { LngLatBounds } from 'maplibre-gl'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

const boundsEqual = (current: LngLatBounds | null, next: LngLatBounds | null) => {
  if (current === null && next === null) return true
  if (current === null || next === null) return false
  return (
    current.getWest() === next.getWest() &&
    current.getSouth() === next.getSouth() &&
    current.getEast() === next.getEast() &&
    current.getNorth() === next.getNorth()
  )
}

const shouldUpdateSize = (current: Store['inspectorSize'], next: Store['inspectorSize']) => {
  const SIZE_UPDATE_WIDTH_THRESHOLD = 50 // px
  const SIZE_UPDATE_HEIGHT_THRESHOLD = 25 // px
  const widthDiff = Math.abs(current.width - next.width)
  const heightDiff = Math.abs(current.height - next.height)
  return widthDiff >= SIZE_UPDATE_WIDTH_THRESHOLD || heightDiff >= SIZE_UPDATE_HEIGHT_THRESHOLD
}

// INFO DEBUGGING: We could use a middleware to log state changes https://github.com/pmndrs/zustand#middleware
export type Store = StoreMapLoadedState &
  StoreMapDataLoadingState &
  StoreFeaturesInspector &
  StoreCalculator &
  StoreSizes &
  StoreInspectorUI &
  Actions

type StoreMapLoadedState = {
  mapLoaded: boolean
}

type StoreMapDataLoadingState = {
  mapDataLoading: boolean
  setFeatureStateLoading: boolean
}

type StoreSizes = {
  mapBounds: LngLatBounds | null
  inspectorSize: { width: number; height: number }
  sidebarSize: { width: number; height: number }
}

export type StoreFeaturesInspector = {
  // https://visgl.github.io/react-map-gl/docs/api-reference/types#mapgeojsonfeature
  inspectorFeatures: MapGeoJSONFeature[]
}

export type StoreCalculator = {
  calculatorAreasWithFeatures: {
    key: string
    features: MapGeoJSONFeature[]
  }[]
}

type StoreInspectorUI = {
  inspectorOtherPropertiesOpen: boolean
}

type Actions = {
  actions: {
    markMapLoaded: () => void
    startMapDataLoading: () => void
    finishMapDataLoading: () => void
    startFeatureStateSync: () => void
    finishFeatureStateSync: () => void
    updateMapBounds: (mapBounds: Store['mapBounds']) => void
    updateInspectorSize: (inspectorSize: Store['inspectorSize']) => void
    updateSidebarSize: (sidebarSize: Store['sidebarSize']) => void
    replaceInspectorFeatures: (inspectObject: Store['inspectorFeatures']) => void
    clearInspectorFeatures: () => void
    updateCalculatorAreasWithFeatures: (
      calculatorAreasWithFeatures: Store['calculatorAreasWithFeatures'],
    ) => void
    setInspectorOtherPropertiesVisibility: (open: Store['inspectorOtherPropertiesOpen']) => void
  }
}

const useMapStore = create<Store>()((set) => {
  return {
    // Guards againt errors when using `mainMap?.getStyle`
    mapLoaded: false,
    // Toggels <LoadingIndicator>
    mapDataLoading: false,
    // Toggels <LoadingIndicator> for feature state updates
    setFeatureStateLoading: false,
    // Data for <Inspector> AND <LayerHighlight>
    inspectorFeatures: [],
    // Data for <Inspector> AND <LayerHighlight>
    calculatorAreasWithFeatures: [],
    mapBounds: null,
    inspectorSize: { width: 0, height: 0 },
    sidebarSize: { width: 0, height: 0 },
    inspectorOtherPropertiesOpen: false,
    actions: {
      markMapLoaded: () => set((state) => (state.mapLoaded ? state : { mapLoaded: true })),
      startMapDataLoading: () =>
        set((state) => (state.mapDataLoading ? state : { mapDataLoading: true })),
      finishMapDataLoading: () =>
        set((state) => (state.mapDataLoading === false ? state : { mapDataLoading: false })),
      startFeatureStateSync: () =>
        set((state) => (state.setFeatureStateLoading ? state : { setFeatureStateLoading: true })),
      finishFeatureStateSync: () =>
        set((state) =>
          state.setFeatureStateLoading === false ? state : { setFeatureStateLoading: false },
        ),
      replaceInspectorFeatures: (inspectorFeatures) => set({ inspectorFeatures }),
      clearInspectorFeatures: () =>
        set((state) => (state.inspectorFeatures.length === 0 ? state : { inspectorFeatures: [] })),
      updateCalculatorAreasWithFeatures: (calculatorAreasWithFeatures) =>
        set({ calculatorAreasWithFeatures }),
      updateMapBounds: (bounds) =>
        set((state) => (boundsEqual(state.mapBounds, bounds) ? state : { mapBounds: bounds })),
      updateInspectorSize: (size) =>
        set((state) =>
          shouldUpdateSize(state.inspectorSize, size) ? { inspectorSize: size } : state,
        ),
      updateSidebarSize: (size) =>
        set((state) => (shouldUpdateSize(state.sidebarSize, size) ? { sidebarSize: size } : state)),
      setInspectorOtherPropertiesVisibility: (open) =>
        set((state) =>
          state.inspectorOtherPropertiesOpen === open
            ? state
            : { inspectorOtherPropertiesOpen: open },
        ),
    },
  }
})

export const useMapLoaded = () => useMapStore((state) => state.mapLoaded)
export const useShowMapLoadingIndicator = () =>
  useMapStore((state) => state.mapDataLoading || state.setFeatureStateLoading)
export const useMapInspectorFeatures = () => useMapStore((state) => state.inspectorFeatures)
export const useMapCalculatorAreasWithFeatures = () =>
  useMapStore((state) => state.calculatorAreasWithFeatures)
export const useMapBounds = () => useMapStore((state) => state.mapBounds)
export const useMapInspectorSize = () => useMapStore((state) => state.inspectorSize)
export const useMapSidebarSize = () => useMapStore((state) => state.sidebarSize)
export const useMapInspectorOtherPropertiesOpen = () =>
  useMapStore((state) => state.inspectorOtherPropertiesOpen)

export const useMapDebugSnapshot = () =>
  useMapStore(
    useShallow((state) => ({
      mapLoaded: state.mapLoaded,
      mapDataLoading: state.mapDataLoading,
      setFeatureStateLoading: state.setFeatureStateLoading,
      mapBounds: state.mapBounds,
      inspectorSize: state.inspectorSize,
      sidebarSize: state.sidebarSize,
      inspectorFeatures: state.inspectorFeatures,
      calculatorAreasWithFeatures: state.calculatorAreasWithFeatures,
      inspectorOtherPropertiesOpen: state.inspectorOtherPropertiesOpen,
    })),
  )

export const useMapActions = () => useMapStore((state) => state.actions)

type InspectorWidthStore = {
  inspectorWidth: number
  setInspectorWidth: (width: number) => void
}

export const useInspectorWidthStore = create<InspectorWidthStore>()(
  persist(
    (set) => ({
      inspectorWidth: 560, // 35rem default
      setInspectorWidth: (width) => set({ inspectorWidth: width }),
    }),
    {
      name: 'tilda-inspector-width',
    },
  ),
)
