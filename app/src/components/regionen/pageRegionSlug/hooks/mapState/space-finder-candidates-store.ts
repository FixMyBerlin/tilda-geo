import { z } from 'zod'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const SpaceFinderCandidateSchema = z.object({
  h3Id: z.string(),
  geometry: z.custom<GeoJSON.Geometry>(
    (value) =>
      typeof value === 'object' &&
      value != null &&
      'type' in value &&
      typeof (value as { type: unknown }).type === 'string',
  ),
  properties: z.record(z.string(), z.json()),
})

const PersistedCandidatesSchema = z.object({
  candidatesByRun: z.record(z.string(), z.array(SpaceFinderCandidateSchema)),
})

/**
 * One hexagon the user picked as a candidate for a future Abstellanlage.
 * Properties come from the rendered tile feature at click time, so the list and
 * GeoJSON export still work after panning away (no re-query of the vector source).
 * Tiles clip hexagons at tile borders, so the full outline is loaded from the
 * server (`getPlanningHexagonGeomFn`) right after the click.
 */
export type SpaceFinderCandidate = z.infer<typeof SpaceFinderCandidateSchema>

type SpaceFinderCandidatesStore = {
  /**
   * Whether the candidate-selection tool (button left of the map search) is active.
   * While active, a click on a hexagon toggles it in the selection instead of
   * opening the feature inspector (see RegionMap `handleClick`).
   */
  selectActive: boolean
  /**
   * Selected hexagons per `PlanningRun` id, each in selection order (the order the sidebar list
   * and export use). Keyed by run, not variant: candidates belong to exactly one result, so a
   * recalculated variant starts with an empty list and switching variants never mixes lists.
   */
  candidatesByRun: Record<number, SpaceFinderCandidate[]>
  actions: {
    setSelectActive: (active: boolean) => void
    /** Adds the hexagon, or removes it if it is already selected. Returns `true` when added. */
    toggleCandidate: (runId: number, candidate: SpaceFinderCandidate) => boolean
    /** Swaps in the full hexagon outline once it is loaded (the tile geometry may be clipped). */
    setCandidateGeometry: (runId: number, h3Id: string, geometry: GeoJSON.Geometry) => void
    removeCandidate: (runId: number, h3Id: string) => void
    clearCandidates: (runId: number) => void
  }
}

/**
 * Candidate selection. Store, not URL, like `vegetationVisible` /
 * `carriagewaysVisible` in `space-finder-boundary-store.ts`: it changes on every
 * click (a URL update would navigate per hexagon) and the geometries do not belong in a URL.
 *
 * `candidatesByRun` is persisted to sessionStorage so a selection survives switching
 * mode or variant and reloading the tab. `selectActive` is not persisted.
 */
const useSpaceFinderCandidatesStore = create<SpaceFinderCandidatesStore>()(
  persist(
    (set, get) => ({
      selectActive: false,
      candidatesByRun: {},
      actions: {
        setSelectActive: (active) => set({ selectActive: active }),
        toggleCandidate: (runId, candidate) => {
          const candidates = get().candidatesByRun[runId] ?? []
          const selected = candidates.some((c) => c.h3Id === candidate.h3Id)
          set((state) => ({
            candidatesByRun: {
              ...state.candidatesByRun,
              [runId]: selected
                ? candidates.filter((c) => c.h3Id !== candidate.h3Id)
                : [...candidates, candidate],
            },
          }))
          return !selected
        },
        setCandidateGeometry: (runId, h3Id, geometry) =>
          set((state) => ({
            candidatesByRun: {
              ...state.candidatesByRun,
              [runId]: (state.candidatesByRun[runId] ?? []).map((c) =>
                c.h3Id === h3Id ? { ...c, geometry } : c,
              ),
            },
          })),
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
      },
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
      merge: (persistedState, currentState) => {
        const parsed = PersistedCandidatesSchema.safeParse(persistedState)
        if (!parsed.success) return currentState
        return {
          ...currentState,
          candidatesByRun: Object.fromEntries(
            Object.entries(parsed.data.candidatesByRun).map(([runId, candidates]) => [
              Number(runId),
              candidates,
            ]),
          ),
        }
      },
    },
  ),
)

const noCandidates: SpaceFinderCandidate[] = []

/** Candidates of one run; a stable empty array when there is no run or no selection yet. */
export const useSpaceFinderCandidates = (runId: number | null) =>
  useSpaceFinderCandidatesStore((s) =>
    runId == null ? noCandidates : (s.candidatesByRun[runId] ?? noCandidates),
  )

export const useSpaceFinderCandidateSelectActive = () =>
  useSpaceFinderCandidatesStore((state) => state.selectActive)

export const useSpaceFinderCandidatesActions = () =>
  useSpaceFinderCandidatesStore((state) => state.actions)

export const getSpaceFinderCandidatesSnapshot = () => useSpaceFinderCandidatesStore.getState()

export const resetSpaceFinderCandidatesState = () =>
  useSpaceFinderCandidatesStore.setState({ selectActive: false, candidatesByRun: {} })
