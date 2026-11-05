import { create } from 'zustand'

type GeoJsonGeometry = object

type SpaceFinderDrawStore = {
  boundaryHighlightGeom: GeoJsonGeometry | null
  /** Translucent fill while creating the Gebiet, outline only while viewing it. */
  boundaryHighlightFilled: boolean
  /** The study-area drawing session is active (draw or edit). */
  drawingActive: boolean
  /** Counts the drawing sessions, so undo steps of an earlier session stay apart. */
  drawSession: number
  /** The drawn study area. The create form reads this as `study_area`. */
  drawnGeometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null
  actions: {
    setBoundaryHighlightGeom: (geom: GeoJsonGeometry | null, opts?: { filled?: boolean }) => void
    setDrawingActive: (active: boolean) => void
    setDrawnGeometry: (geom: GeoJSON.Polygon | GeoJSON.MultiPolygon | null) => void
  }
}

const useSpaceFinderDrawStore = create<SpaceFinderDrawStore>()((set) => ({
  boundaryHighlightGeom: null,
  boundaryHighlightFilled: true,
  drawingActive: false,
  drawSession: 0,
  drawnGeometry: null,
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
  },
}))

export const useSpaceFinderBoundaryHighlightGeom = () =>
  useSpaceFinderDrawStore((state) => state.boundaryHighlightGeom)
export const useSpaceFinderBoundaryHighlightFilled = () =>
  useSpaceFinderDrawStore((state) => state.boundaryHighlightFilled)
export const useSpaceFinderDrawingActive = () =>
  useSpaceFinderDrawStore((state) => state.drawingActive)
export const useSpaceFinderDrawSession = () => useSpaceFinderDrawStore((state) => state.drawSession)
export const useSpaceFinderDrawnGeometry = () =>
  useSpaceFinderDrawStore((state) => state.drawnGeometry)

export const useSpaceFinderDrawActions = () => useSpaceFinderDrawStore((state) => state.actions)
