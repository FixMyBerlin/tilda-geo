import { create } from 'zustand'

/**
 * One hexagon the user picked as a candidate for a future Abstellanlage.
 * Everything the sidebar list and the GeoJSON export need is captured at click
 * time from the rendered tile feature — the selection therefore survives panning
 * away from the hexagon (no re-query of the vector source needed).
 */
export type PlanningCandidate = {
  /** `h3_id` of the hexagon (the tile source's `promoteId`); identity of a candidate. */
  h3Id: string
  /** Hexagon outline from the vector tile (lng/lat), reused for the highlight and the export. */
  geometry: object
  /** Score columns of the hexagon (`mce_gesamtscore`, `score_bedarf`, …), exported as-is. */
  properties: Record<string, any>
}

type Store = {
  /**
   * Whether the candidate-selection tool (button left of the map search) is active.
   * While active, a click on a hexagon toggles it in the selection instead of
   * opening the feature inspector (see RegionMap `handleClick`).
   */
  selectActive: boolean
  setSelectActive: (active: boolean) => void

  /** Selected hexagons in selection order (the order the sidebar list and export use). */
  candidates: PlanningCandidate[]
  /** Adds the hexagon or – when it is already selected – removes it again. */
  toggleCandidate: (candidate: PlanningCandidate) => void
  removeCandidate: (h3Id: string) => void
  clearCandidates: () => void
}

/**
 * Candidate selection of the planning module. Kept in a store (NOT in the URL) for
 * the same reason as `vegetationVisible`/`carriagewaysVisible` in
 * usePlanningBoundaryState: it changes on every click and would otherwise trigger a
 * router navigation per hexagon — and the geometries it holds don't belong in a URL.
 */
export const usePlanningCandidatesState = create<Store>((set) => ({
  selectActive: false,
  setSelectActive: (active) => set({ selectActive: active }),

  candidates: [],
  toggleCandidate: (candidate) =>
    set((state) =>
      state.candidates.some((c) => c.h3Id === candidate.h3Id)
        ? { candidates: state.candidates.filter((c) => c.h3Id !== candidate.h3Id) }
        : { candidates: [...state.candidates, candidate] },
    ),
  removeCandidate: (h3Id) =>
    set((state) => ({ candidates: state.candidates.filter((c) => c.h3Id !== h3Id) })),
  clearCandidates: () => set({ candidates: [] }),
}))
