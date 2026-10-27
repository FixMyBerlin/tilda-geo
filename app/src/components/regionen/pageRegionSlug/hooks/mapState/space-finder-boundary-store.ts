import { create } from 'zustand'

type GeoJsonGeometry = object

type SpaceFinderBoundaryStore = {
  boundaryHighlightGeom: GeoJsonGeometry | null
  /** Translucent fill while creating the Gebiet, outline only while viewing it. */
  boundaryHighlightFilled: boolean
  /** The study-area drawing session is active (draw or edit). */
  drawingActive: boolean
  /** Counts the drawing sessions, so undo steps of an earlier session stay apart. */
  drawSession: number
  /** The drawn study area. The create form reads this as `study_area`. */
  drawnGeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null
  /**
   * Uploaded "Eigene Daten" GeoJSON (`factorConfig.user_geojson`) for the active variant.
   * Set by `SpaceFinderBody`. Null when none is uploaded.
   */
  userObstaclesGeom: GeoJsonGeometry | null
  /**
   * Whether the "Eigene Daten" control layer is shown. Store, not URL, like
   * `vegetationVisible`. Defaults to true: whoever uploaded their own data wants to see it
   * first. The toggle is for hiding it.
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
   * Store, not URL, like `vegetationVisible`. Default off: there are many points and
   * they should not obscure the hexagons.
   */
  censusVisible: boolean
  /**
   * True from a factor edit until its auto-save has landed (`FactorEditorPanel`).
   * Lives here so `RunButton` (a sibling) can block a run until the server has the
   * draft. Otherwise the job would score the previous saved config.
   */
  factorSavePending: boolean
  /**
   * Square meters being typed into „Fläche suchen“, before blur saves them on the variant.
   * `null`: the map uses `factorConfig.min_area_m2`. `0`: the field was cleared, so the map
   * does not fall back to the saved number. The URL only stores whether the filter is on.
   */
  minAreaDraft: number | null
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
    setDrawnGeometry: (geom: GeoJSON.Polygon | GeoJSON.MultiPolygon | null) => void
    setUserObstaclesGeom: (geom: GeoJsonGeometry | null) => void
    setUserObstaclesVisible: (visible: boolean) => void
    setVegetationVisible: (visible: boolean) => void
    setVegetationAttribution: (attribution: string | null) => void
    setCarriagewaysVisible: (visible: boolean) => void
    setCensusVisible: (visible: boolean) => void
    setFactorSavePending: (pending: boolean) => void
    setMinAreaDraft: (draft: number | null) => void
    setLastFittedBoundaryKey: (key: string | null) => void
  }
}

const useSpaceFinderBoundaryStore = create<SpaceFinderBoundaryStore>()((set) => ({
  boundaryHighlightGeom: null,
  boundaryHighlightFilled: true,
  drawingActive: false,
  drawSession: 0,
  drawnGeometry: null,
  userObstaclesGeom: null,
  userObstaclesVisible: true,
  vegetationVisible: false,
  vegetationAttribution: null,
  carriagewaysVisible: false,
  censusVisible: false,
  factorSavePending: false,
  minAreaDraft: null,
  lastFittedBoundaryKey: null,
  actions: {
    setBoundaryHighlightGeom: (geom, opts) =>
      set({ boundaryHighlightGeom: geom, boundaryHighlightFilled: opts?.filled ?? true }),
    setDrawingActive: (active) =>
      set((state) =>
        state.drawingActive === active
          ? state
          : {
              drawingActive: active,
              drawSession: active ? state.drawSession + 1 : state.drawSession,
            },
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
    setMinAreaDraft: (draft) =>
      set((state) => (state.minAreaDraft === draft ? state : { minAreaDraft: draft })),
    setLastFittedBoundaryKey: (key) => set({ lastFittedBoundaryKey: key }),
  },
}))

export const useSpaceFinderBoundaryHighlightGeom = () =>
  useSpaceFinderBoundaryStore((state) => state.boundaryHighlightGeom)
export const useSpaceFinderBoundaryHighlightFilled = () =>
  useSpaceFinderBoundaryStore((state) => state.boundaryHighlightFilled)
export const useSpaceFinderDrawingActive = () =>
  useSpaceFinderBoundaryStore((state) => state.drawingActive)
export const useSpaceFinderDrawSession = () =>
  useSpaceFinderBoundaryStore((state) => state.drawSession)
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
export const useSpaceFinderMinAreaDraft = () =>
  useSpaceFinderBoundaryStore((state) => state.minAreaDraft)

export const useSpaceFinderBoundaryActions = () =>
  useSpaceFinderBoundaryStore((state) => state.actions)

export const getLastFittedBoundaryKey = () =>
  useSpaceFinderBoundaryStore.getState().lastFittedBoundaryKey
