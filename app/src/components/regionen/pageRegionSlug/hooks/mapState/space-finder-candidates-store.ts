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

/**
 * Store key of one `PlanningRun`: id plus creation time. The id alone is not unique for
 * sessionStorage — the same origin (127.0.0.1:5173) serves different databases (main checkout,
 * worktrees, a fresh seed or db-pull), and their run ids overlap. Without the timestamp a new run
 * would show the candidates of an unrelated run with the same id.
 */
export const candidateRunKey = (run: { id: number; createdAt: Date | string }) =>
  `${run.id}@${new Date(run.createdAt).getTime()}`

const isRunKey = (key: string) => /^\d+@\d+$/.test(key)

type SpaceFinderCandidatesStore = {
  /**
   * Whether the candidate-selection tool (button left of the map search) is active.
   * While active, a click on a hexagon toggles it in the selection instead of
   * opening the feature inspector (see RegionMap `handleClick`).
   */
  selectActive: boolean
  /**
   * Selected hexagons per run (`candidateRunKey`), each in selection order (the order the sidebar
   * list and export use). Keyed by run, not variant: candidates belong to exactly one result, so a
   * recalculated variant starts with an empty list and switching variants never mixes lists.
   */
  candidatesByRun: Record<string, SpaceFinderCandidate[]>
  actions: {
    setSelectActive: (active: boolean) => void
    /** Adds the hexagon, or removes it if it is already selected. Returns `true` when added. */
    toggleCandidate: (runKey: string, candidate: SpaceFinderCandidate) => boolean
    /** Swaps in the full hexagon outline once it is loaded (the tile geometry may be clipped). */
    setCandidateGeometry: (runKey: string, h3Id: string, geometry: GeoJSON.Geometry) => void
    removeCandidate: (runKey: string, h3Id: string) => void
    clearCandidates: (runKey: string) => void
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
        toggleCandidate: (runKey, candidate) => {
          const candidates = get().candidatesByRun[runKey] ?? []
          const selected = candidates.some((c) => c.h3Id === candidate.h3Id)
          set((state) => ({
            candidatesByRun: {
              ...state.candidatesByRun,
              [runKey]: selected
                ? candidates.filter((c) => c.h3Id !== candidate.h3Id)
                : [...candidates, candidate],
            },
          }))
          return !selected
        },
        setCandidateGeometry: (runKey, h3Id, geometry) =>
          set((state) => ({
            candidatesByRun: {
              ...state.candidatesByRun,
              [runKey]: (state.candidatesByRun[runKey] ?? []).map((c) =>
                c.h3Id === h3Id ? { ...c, geometry } : c,
              ),
            },
          })),
        removeCandidate: (runKey, h3Id) =>
          set((state) => ({
            candidatesByRun: {
              ...state.candidatesByRun,
              [runKey]: (state.candidatesByRun[runKey] ?? []).filter((c) => c.h3Id !== h3Id),
            },
          })),
        clearCandidates: (runKey) =>
          set((state) => {
            const { [runKey]: _cleared, ...candidatesByRun } = state.candidatesByRun
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
          // Older sessions keyed by the bare run id cannot be matched to a run safely — drop them.
          candidatesByRun: Object.fromEntries(
            Object.entries(parsed.data.candidatesByRun).filter(([runKey]) => isRunKey(runKey)),
          ),
        }
      },
    },
  ),
)

const noCandidates: SpaceFinderCandidate[] = []

/** Candidates of one run; a stable empty array when there is no run or no selection yet. */
export const useSpaceFinderCandidates = (runKey: string | null) =>
  useSpaceFinderCandidatesStore((s) =>
    runKey == null ? noCandidates : (s.candidatesByRun[runKey] ?? noCandidates),
  )

export const useSpaceFinderCandidateSelectActive = () =>
  useSpaceFinderCandidatesStore((state) => state.selectActive)

export const useSpaceFinderCandidatesActions = () =>
  useSpaceFinderCandidatesStore((state) => state.actions)

export const getSpaceFinderCandidatesSnapshot = () => useSpaceFinderCandidatesStore.getState()

export const resetSpaceFinderCandidatesState = () =>
  useSpaceFinderCandidatesStore.setState({ selectActive: false, candidatesByRun: {} })
