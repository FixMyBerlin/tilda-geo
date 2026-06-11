import { create } from 'zustand'

type GeoJsonGeometry = object

type Store = {
  boundaryHighlightGeom: GeoJsonGeometry | null
  setBoundaryHighlightGeom: (geom: GeoJsonGeometry | null) => void
}

export const usePlanningBoundaryState = create<Store>((set) => ({
  boundaryHighlightGeom: null,
  setBoundaryHighlightGeom: (geom) => set({ boundaryHighlightGeom: geom }),
}))
