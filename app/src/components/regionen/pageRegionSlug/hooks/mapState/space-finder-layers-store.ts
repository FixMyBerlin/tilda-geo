import { create } from 'zustand'

type GeoJsonGeometry = object

/** Visibility and data of the Flächenfinder result layers. Store, not URL, so toggling does not navigate. */
type SpaceFinderLayersStore = {
  /**
   * Uploaded "Eigene Daten" GeoJSON (`factorConfig.user_geojson`) for the active variant.
   * Set by `SpaceFinderBody`. Null when none is uploaded.
   */
  userObstaclesGeom: GeoJsonGeometry | null
  /**
   * Whether the "Eigene Daten" control layer is shown. Defaults to true: whoever uploaded
   * their own data wants to see it first. The toggle is for hiding it.
   */
  userObstaclesVisible: boolean
  /** Whether the on-demand vegetation (NDVI) result layer is shown. */
  vegetationVisible: boolean
  /**
   * MapLibre attribution string for the active variant's CIR source.
   * Set by `SpaceFinderBody`. Null when no vegetation source applies
   * (`w_vegetation` = 0 or study area outside known CIR coverage).
   * Passed to the vegetation `<Source>` so MapLibre's AttributionControl shows it
   * whenever the vegetation layer is visible.
   */
  vegetationAttribution: string | null
  /** Whether the Fahrbahnen ("Fahrbahnen ausschließen") result layer is shown. */
  carriagewaysVisible: boolean
  /**
   * Whether the Zensus-Einwohnerpunkte layer (Bewohnerbedarf) is shown. Default off: there
   * are many points and they should not obscure the hexagons.
   */
  censusVisible: boolean
  actions: {
    setUserObstaclesGeom: (geom: GeoJsonGeometry | null) => void
    setUserObstaclesVisible: (visible: boolean) => void
    setVegetationVisible: (visible: boolean) => void
    setVegetationAttribution: (attribution: string | null) => void
    setCarriagewaysVisible: (visible: boolean) => void
    setCensusVisible: (visible: boolean) => void
  }
}

const useSpaceFinderLayersStore = create<SpaceFinderLayersStore>()((set) => ({
  userObstaclesGeom: null,
  userObstaclesVisible: true,
  vegetationVisible: false,
  vegetationAttribution: null,
  carriagewaysVisible: false,
  censusVisible: false,
  actions: {
    setUserObstaclesGeom: (geom) => set({ userObstaclesGeom: geom }),
    setUserObstaclesVisible: (visible) => set({ userObstaclesVisible: visible }),
    setVegetationVisible: (visible) => set({ vegetationVisible: visible }),
    setVegetationAttribution: (attribution) => set({ vegetationAttribution: attribution }),
    setCarriagewaysVisible: (visible) => set({ carriagewaysVisible: visible }),
    setCensusVisible: (visible) => set({ censusVisible: visible }),
  },
}))

export const useSpaceFinderUserObstaclesGeom = () =>
  useSpaceFinderLayersStore((state) => state.userObstaclesGeom)
export const useSpaceFinderUserObstaclesVisible = () =>
  useSpaceFinderLayersStore((state) => state.userObstaclesVisible)
export const useSpaceFinderVegetationVisible = () =>
  useSpaceFinderLayersStore((state) => state.vegetationVisible)
export const useSpaceFinderVegetationAttribution = () =>
  useSpaceFinderLayersStore((state) => state.vegetationAttribution)
export const useSpaceFinderCarriagewaysVisible = () =>
  useSpaceFinderLayersStore((state) => state.carriagewaysVisible)
export const useSpaceFinderCensusVisible = () =>
  useSpaceFinderLayersStore((state) => state.censusVisible)

export const useSpaceFinderLayersActions = () => useSpaceFinderLayersStore((state) => state.actions)
