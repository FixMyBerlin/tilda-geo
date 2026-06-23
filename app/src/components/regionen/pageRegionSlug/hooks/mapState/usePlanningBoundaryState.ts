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
}))
