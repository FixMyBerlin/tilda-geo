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
  /** Geometry produced by the map drawing tool; read by the create form as the study_area. */
  drawnGeometry: GeoJsonGeometry | null
  setDrawnGeometry: (geom: GeoJsonGeometry | null) => void

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
}

export const usePlanningBoundaryState = create<Store>((set) => ({
  boundaryHighlightGeom: null,
  boundaryHighlightFilled: true,
  setBoundaryHighlightGeom: (geom, opts) =>
    set({ boundaryHighlightGeom: geom, boundaryHighlightFilled: opts?.filled ?? true }),

  drawingActive: false,
  setDrawingActive: (active) => set({ drawingActive: active }),
  drawnGeometry: null,
  setDrawnGeometry: (geom) => set({ drawnGeometry: geom }),

  vegetationVisible: false,
  setVegetationVisible: (visible) => set({ vegetationVisible: visible }),

  vegetationAttribution: null,
  setVegetationAttribution: (attribution) => set({ vegetationAttribution: attribution }),
}))
