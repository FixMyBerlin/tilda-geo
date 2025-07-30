import { isEqual } from 'lodash'
import { LngLatBounds } from 'maplibre-gl'
import { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { create } from 'zustand'

// INFO DEBUGGING: We could use a middleware to log state changes https://github.com/pmndrs/zustand#middleware
export type Store = StoreMapLoadedState &
  StoreMapDataLoadingState &
  StoreFeaturesInspector &
  StoreCalculator &
  StoreSizes &
  Actions

type StoreMapLoadedState = {
  mapLoaded: boolean
}

type StoreMapDataLoadingState = {
  mapDataLoading: boolean
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

type Actions = {
  actions: {
    setMapLoaded: (mapLoaded: Store['mapLoaded']) => void
    setMapDataLoading: (mapDataLoading: Store['mapDataLoading']) => void
    setMapBounds: (mapBounds: Store['mapBounds']) => void
    setInspectorSize: (inspectorSize: Store['inspectorSize']) => void
    setSidebarSize: (sidebarSize: Store['sidebarSize']) => void
    setInspectorFeatures: (inspectObject: Store['inspectorFeatures']) => void
    resetInspectorFeatures: () => void
    setCalculatorAreasWithFeatures: (
      calculatorAreasWithFeatures: Store['calculatorAreasWithFeatures'],
    ) => void
  }
}

function setIfChanged(get, set, name, value) {
  if (isEqual(get()[name], value)) return
  set({ [name]: value })
}

export const useMapState = create<Store>((set, get) => {
  return {
    // Guards againt errors when using `mainMap?.getStyle`
    mapLoaded: false,
    // Toggels <LoadingIndicator>
    mapDataLoading: false,
    // Data for <Inspector> AND <LayerHighlight>
    inspectorFeatures: [],
    // Data for <Inspector> AND <LayerHighlight>
    calculatorAreasWithFeatures: [],
    mapBounds: null,
    inspectorSize: { width: 0, height: 0 },
    sidebarSize: { width: 0, height: 0 },
    actions: {
      setMapLoaded: (mapLoaded) => set({ mapLoaded }),
      setMapDataLoading: (mapDataLoading) => set({ mapDataLoading }),
      setInspectorFeatures: (inspectorFeatures) => set({ inspectorFeatures }),
      resetInspectorFeatures: () => set({ inspectorFeatures: [] }),
      setCalculatorAreasWithFeatures: (calculatorAreasWithFeatures) =>
        set({ calculatorAreasWithFeatures }),
      setMapBounds: (bounds) => set({ mapBounds: bounds }),
      setInspectorSize: (size) => setIfChanged(get, set, 'inspectorSize', size),
      setSidebarSize: (size) => {
        setIfChanged(get, set, 'sidebarSize', size)
      },
    },
  }
})

export const useMapLoaded = () => useMapState((state) => state.mapLoaded)
export const useMapDataLoading = () => useMapState((state) => state.mapDataLoading)
export const useMapInspectorFeatures = () => useMapState((state) => state.inspectorFeatures)
export const useMapCalculatorAreasWithFeatures = () =>
  useMapState((state) => state.calculatorAreasWithFeatures)
export const useMapBounds = () => useMapState((state) => state.mapBounds)
export const useMapInspectorSize = () => useMapState((state) => state.inspectorSize)
export const useMapSidebarSize = () => useMapState((state) => state.sidebarSize)

export const useMapActions = () => useMapState((state) => state.actions)
