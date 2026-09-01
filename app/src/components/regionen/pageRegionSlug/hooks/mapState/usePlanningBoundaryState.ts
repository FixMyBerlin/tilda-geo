import { create } from 'zustand'

type GeoJsonGeometry = object

type Store = {
  boundaryHighlightGeom: GeoJsonGeometry | null
  /** Whether to render the boundary with a translucent fill (creation) or outline only (viewing). */
  boundaryHighlightFilled: boolean
  setBoundaryHighlightGeom: (geom: GeoJsonGeometry | null, opts?: { filled?: boolean }) => void

  /** Whether the user is currently drawing a study area on the map (TerraDraw active). */
  drawingActive: boolean
  setDrawingActive: (active: boolean) => void
  /**
   * True ONLY while the user is actively placing polygon points (TerraDraw polygon mode),
   * NOT during the edit/select mode after the polygon is finished. Distinct from
   * `drawingActive` (whole session): used by RegionMap to suppress data-layer clicks so
   * placing points can't accidentally open the feature inspector.
   */
  polygonDrawInProgress: boolean
  setPolygonDrawInProgress: (active: boolean) => void
  /** Geometry produced by the map drawing tool; read by the create form as the study_area. */
  drawnGeometry: GeoJsonGeometry | null
  setDrawnGeometry: (geom: GeoJsonGeometry | null) => void

  /**
   * The active scenario's uploaded "Eigene Flächen" GeoJSON (factorConfig.user_geojson),
   * shown as a control layer on the map. Set by ScenarioDetail when a scenario is opened;
   * null when none is uploaded.
   */
  userObstaclesGeom: GeoJsonGeometry | null
  setUserObstaclesGeom: (geom: GeoJsonGeometry | null) => void

  /**
   * Whether the "Eigene Daten" control layer is shown. Same rationale as
   * `vegetationVisible` (store, not URL). Defaults to true: wer eigene Daten
   * hochgeladen hat, will sie zunächst sehen – der Schalter dient dem Ausblenden.
   */
  userObstaclesVisible: boolean
  setUserObstaclesVisible: (visible: boolean) => void

  /**
   * Whether the on-demand vegetation (NDVI) result layer is shown. Kept in this
   * store (NOT in the URL) so toggling it doesn't trigger a router navigation –
   * a transient view switch the user flips frequently while inspecting hexagons.
   */
  vegetationVisible: boolean
  setVegetationVisible: (visible: boolean) => void

  /**
   * MapLibre attribution string for the active scenario's CIR source.
   * Set by ScenarioDetail when loading a scenario; null when no vegetation source
   * applies (w_vegetation = 0 or study area outside known CIR coverage).
   * Passed to the vegetation <Source> so MapLibre's AttributionControl shows it
   * automatically whenever the vegetation layer is visible.
   */
  vegetationAttribution: string | null
  setVegetationAttribution: (attribution: string | null) => void

  /**
   * Whether the Fahrbahnen ("Fahrbahnen ausschließen") result layer is shown.
   * Same rationale as `vegetationVisible`: kept in this store, not the URL, so
   * toggling doesn't trigger a router navigation.
   */
  carriagewaysVisible: boolean
  setCarriagewaysVisible: (visible: boolean) => void

  /**
   * Whether the planning panel is collapsed to its header (title + active scenario
   * summary) to free up map space. Auto-set to true when a run's result is saved
   * (JobStatusBadge on DONE); toggled manually via the header button in PlanningPanel.
   */
  panelCollapsed: boolean
  setPanelCollapsed: (collapsed: boolean) => void

  /**
   * Id of the job for which the DONE auto-collapse already fired. Lives here (not
   * component state) because JobStatusBadge unmounts/remounts as the panel
   * collapses/expands (ScenarioDetail only renders while expanded) – without this,
   * re-expanding the panel would remount the badge and immediately re-collapse it.
   */
  autoCollapsedJobId: number | null
  setAutoCollapsedJobId: (jobId: number | null) => void

  /**
   * True from the moment a factor is changed until its auto-save has landed (see
   * FactorEditorPanel). Lives here because RunButton — a sibling component — muss den Start
   * einer Berechnung so lange sperren: sonst rechnet der Lauf serverseitig mit dem noch nicht
   * gespeicherten Stand.
   */
  factorSavePending: boolean
  setFactorSavePending: (pending: boolean) => void

  /**
   * Bbox key of the study area the map was last flown to (see ScenarioDetail).
   * Lives here (not component state) so it survives ScenarioDetail unmounting when
   * the panel collapses. Switching between scenarios that share the same study area
   * – the "compare variants" case – must not move the camera; only a scenario with a
   * different boundary triggers a new fitBounds.
   */
  lastFittedBoundaryKey: string | null
  setLastFittedBoundaryKey: (key: string | null) => void
}

export const usePlanningBoundaryState = create<Store>((set) => ({
  boundaryHighlightGeom: null,
  boundaryHighlightFilled: true,
  setBoundaryHighlightGeom: (geom, opts) =>
    set({ boundaryHighlightGeom: geom, boundaryHighlightFilled: opts?.filled ?? true }),

  drawingActive: false,
  setDrawingActive: (active) => set({ drawingActive: active }),
  polygonDrawInProgress: false,
  setPolygonDrawInProgress: (active) =>
    set((state) =>
      state.polygonDrawInProgress === active ? state : { polygonDrawInProgress: active },
    ),
  drawnGeometry: null,
  setDrawnGeometry: (geom) => set({ drawnGeometry: geom }),

  userObstaclesGeom: null,
  setUserObstaclesGeom: (geom) => set({ userObstaclesGeom: geom }),

  userObstaclesVisible: true,
  setUserObstaclesVisible: (visible) => set({ userObstaclesVisible: visible }),

  vegetationVisible: false,
  setVegetationVisible: (visible) => set({ vegetationVisible: visible }),

  vegetationAttribution: null,
  setVegetationAttribution: (attribution) => set({ vegetationAttribution: attribution }),

  carriagewaysVisible: false,
  setCarriagewaysVisible: (visible) => set({ carriagewaysVisible: visible }),

  panelCollapsed: false,
  setPanelCollapsed: (collapsed) => set({ panelCollapsed: collapsed }),

  autoCollapsedJobId: null,
  setAutoCollapsedJobId: (jobId) => set({ autoCollapsedJobId: jobId }),

  factorSavePending: false,
  setFactorSavePending: (pending) =>
    set((state) => (state.factorSavePending === pending ? state : { factorSavePending: pending })),

  lastFittedBoundaryKey: null,
  setLastFittedBoundaryKey: (key) => set({ lastFittedBoundaryKey: key }),
}))
