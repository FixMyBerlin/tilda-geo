import { create } from 'zustand'

type GeoJsonGeometry = object

type SpaceFinderBoundaryStore = {
  boundaryHighlightGeom: GeoJsonGeometry | null
  /** Translucent fill while creating the Gebiet, outline only while viewing it. */
  boundaryHighlightFilled: boolean
  /** TerraDraw session is active (draw or edit). */
  drawingActive: boolean
  /**
   * True while TerraDraw is in polygon mode (placing vertices). False in edit/select
   * after the polygon is finished. Distinct from `drawingActive` (whole session).
   * RegionMap ignores data-layer clicks while this is true so a vertex click does not
   * open the feature inspector.
   */
  polygonDrawInProgress: boolean
  /** TerraDraw output. The create form reads this as `study_area`. */
  drawnGeometry: GeoJsonGeometry | null
  /**
   * Uploaded "Eigene Daten" GeoJSON (`factorConfig.user_geojson`) for the active variant.
   * Set by `SpaceFinderBody`. Null when none is uploaded.
   */
  userObstaclesGeom: GeoJsonGeometry | null
  /**
   * Whether the "Eigene Daten" control layer is shown. Store, not URL, like
   * `vegetationVisible`. Defaults to true: wer eigene Daten hochgeladen hat, will sie
   * zunächst sehen. Der Schalter dient dem Ausblenden.
   */
  userObstaclesVisible: boolean
  /**
   * Whether the on-demand vegetation (NDVI) result layer is shown. Kept in this store,
   * not the URL, so toggling it does not trigger a router navigation.
   */
  vegetationVisible: boolean
  /**
   * MapLibre attribution string for the active variant's CIR source.
   * Set by `SpaceFinderBody`. Null when no vegetation source applies
   * (`w_vegetation` = 0 or study area outside known CIR coverage).
   * Passed to the vegetation `<Source>` so MapLibre's AttributionControl shows it
   * whenever the vegetation layer is visible.
   */
  vegetationAttribution: string | null
  /**
   * Whether the Fahrbahnen ("Fahrbahnen ausschließen") result layer is shown.
   * Store, not URL, like `vegetationVisible`.
   */
  carriagewaysVisible: boolean
  /**
   * Whether the Zensus-Einwohnerpunkte layer (Bewohnerbedarf) is shown.
   * Store, not URL, like `vegetationVisible`. Default off: es sind viele Punkte,
   * sie sollen den Blick auf die Hexagone nicht verstellen.
   */
  censusVisible: boolean
  /**
   * True from a factor edit until its auto-save has landed (`FactorEditorPanel`).
   * Lives here so `RunButton` (a sibling) can block a run until the server has the
   * draft. Otherwise the job would score the previous saved config.
   */
  factorSavePending: boolean
  /**
   * Bbox key of the study area the map was last flown to (`PageModeSpaceFinder`).
   * Lives here so it survives the panel body unmounting. Switching variants that
   * share the same study area must not move the camera. A different boundary
   * triggers a new `fitBounds`.
   */
  lastFittedBoundaryKey: string | null
  actions: {
    setBoundaryHighlightGeom: (geom: GeoJsonGeometry | null, opts?: { filled?: boolean }) => void
    setDrawingActive: (active: boolean) => void
    setPolygonDrawInProgress: (active: boolean) => void
    setDrawnGeometry: (geom: GeoJsonGeometry | null) => void
    setUserObstaclesGeom: (geom: GeoJsonGeometry | null) => void
    setUserObstaclesVisible: (visible: boolean) => void
    setVegetationVisible: (visible: boolean) => void
    setVegetationAttribution: (attribution: string | null) => void
    setCarriagewaysVisible: (visible: boolean) => void
    setCensusVisible: (visible: boolean) => void
    setFactorSavePending: (pending: boolean) => void
    setLastFittedBoundaryKey: (key: string | null) => void
  }
}

const useSpaceFinderBoundaryStore = create<SpaceFinderBoundaryStore>()((set) => ({
  boundaryHighlightGeom: null,
  boundaryHighlightFilled: true,
  drawingActive: false,
  polygonDrawInProgress: false,
  drawnGeometry: null,
  userObstaclesGeom: null,
  userObstaclesVisible: true,
  vegetationVisible: false,
  vegetationAttribution: null,
  carriagewaysVisible: false,
  censusVisible: false,
  factorSavePending: false,
  lastFittedBoundaryKey: null,
  actions: {
    setBoundaryHighlightGeom: (geom, opts) =>
      set({ boundaryHighlightGeom: geom, boundaryHighlightFilled: opts?.filled ?? true }),
    setDrawingActive: (active) => set({ drawingActive: active }),
    setPolygonDrawInProgress: (active) =>
      set((state) =>
        state.polygonDrawInProgress === active ? state : { polygonDrawInProgress: active },
      ),
    setDrawnGeometry: (geom) => set({ drawnGeometry: geom }),
    setUserObstaclesGeom: (geom) => set({ userObstaclesGeom: geom }),
    setUserObstaclesVisible: (visible) => set({ userObstaclesVisible: visible }),
    setVegetationVisible: (visible) => set({ vegetationVisible: visible }),
    setVegetationAttribution: (attribution) => set({ vegetationAttribution: attribution }),
    setCarriagewaysVisible: (visible) => set({ carriagewaysVisible: visible }),
    setCensusVisible: (visible) => set({ censusVisible: visible }),
    setFactorSavePending: (pending) =>
      set((state) =>
        state.factorSavePending === pending ? state : { factorSavePending: pending },
      ),
    setLastFittedBoundaryKey: (key) => set({ lastFittedBoundaryKey: key }),
  },
}))

export const useSpaceFinderBoundaryHighlightGeom = () =>
  useSpaceFinderBoundaryStore((state) => state.boundaryHighlightGeom)
export const useSpaceFinderBoundaryHighlightFilled = () =>
  useSpaceFinderBoundaryStore((state) => state.boundaryHighlightFilled)
export const useSpaceFinderDrawingActive = () =>
  useSpaceFinderBoundaryStore((state) => state.drawingActive)
export const useSpaceFinderPolygonDrawInProgress = () =>
  useSpaceFinderBoundaryStore((state) => state.polygonDrawInProgress)
export const useSpaceFinderDrawnGeometry = () =>
  useSpaceFinderBoundaryStore((state) => state.drawnGeometry)
export const useSpaceFinderUserObstaclesGeom = () =>
  useSpaceFinderBoundaryStore((state) => state.userObstaclesGeom)
export const useSpaceFinderUserObstaclesVisible = () =>
  useSpaceFinderBoundaryStore((state) => state.userObstaclesVisible)
export const useSpaceFinderVegetationVisible = () =>
  useSpaceFinderBoundaryStore((state) => state.vegetationVisible)
export const useSpaceFinderVegetationAttribution = () =>
  useSpaceFinderBoundaryStore((state) => state.vegetationAttribution)
export const useSpaceFinderCarriagewaysVisible = () =>
  useSpaceFinderBoundaryStore((state) => state.carriagewaysVisible)
export const useSpaceFinderCensusVisible = () =>
  useSpaceFinderBoundaryStore((state) => state.censusVisible)
export const useSpaceFinderFactorSavePending = () =>
  useSpaceFinderBoundaryStore((state) => state.factorSavePending)

export const useSpaceFinderBoundaryActions = () =>
  useSpaceFinderBoundaryStore((state) => state.actions)

export const getLastFittedBoundaryKey = () =>
  useSpaceFinderBoundaryStore.getState().lastFittedBoundaryKey
