import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * One hexagon the user picked as a candidate for a future Abstellanlage.
 * Everything the sidebar list and the GeoJSON export need is captured at click
 * time from the rendered tile feature — the selection therefore survives panning
 * away from the hexagon (no re-query of the vector source needed).
 */
export type SpaceFinderCandidate = {
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

  /**
   * Selected hexagons per `PlanningRun` id, each in selection order (the order the sidebar list
   * and export use). Keyed by run, not variant: candidates belong to exactly one result, so a
   * recalculated variant starts with an empty list and switching variants never mixes lists.
   */
  candidatesByRun: Record<number, SpaceFinderCandidate[]>
  /** Adds the hexagon or – when it is already selected – removes it again. */
  toggleCandidate: (runId: number, candidate: SpaceFinderCandidate) => void
  removeCandidate: (runId: number, h3Id: string) => void
  clearCandidates: (runId: number) => void
}

/**
 * Candidate selection of the planning module. Kept in a store (NOT in the URL) for
 * the same reason as `vegetationVisible`/`carriagewaysVisible` in
 * useSpaceFinderBoundaryState: it changes on every click and would otherwise trigger a
 * router navigation per hexagon — and the geometries it holds don't belong in a URL.
 *
 * `candidatesByRun` is persisted to sessionStorage so a selection survives switching to another
 * mode or variant and reloading the tab; `selectActive` is not persisted.
 */
export const useSpaceFinderCandidatesState = create<Store>()(
  persist(
    (set) => ({
      selectActive: false,
      setSelectActive: (active) => set({ selectActive: active }),

      candidatesByRun: {},
      toggleCandidate: (runId, candidate) =>
        set((state) => {
          const candidates = state.candidatesByRun[runId] ?? []
          return {
            candidatesByRun: {
              ...state.candidatesByRun,
              [runId]: candidates.some((c) => c.h3Id === candidate.h3Id)
                ? candidates.filter((c) => c.h3Id !== candidate.h3Id)
                : [...candidates, candidate],
            },
          }
        }),
      removeCandidate: (runId, h3Id) =>
        set((state) => ({
          candidatesByRun: {
            ...state.candidatesByRun,
            [runId]: (state.candidatesByRun[runId] ?? []).filter((c) => c.h3Id !== h3Id),
          },
        })),
      clearCandidates: (runId) =>
        set((state) => {
          const { [runId]: _cleared, ...candidatesByRun } = state.candidatesByRun
          return { candidatesByRun }
        }),
    }),
    {
      name: 'fmc-spacefinder-candidates',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          }
        }
        return sessionStorage
      }),
      partialize: (state) => ({ candidatesByRun: state.candidatesByRun }),
    },
  ),
)

const noCandidates: SpaceFinderCandidate[] = []

/** Candidates of one run; a stable empty array when there is no run or no selection yet. */
export const useSpaceFinderCandidates = (runId: number | null) =>
  useSpaceFinderCandidatesState((s) =>
    runId == null ? noCandidates : (s.candidatesByRun[runId] ?? noCandidates),
  )
