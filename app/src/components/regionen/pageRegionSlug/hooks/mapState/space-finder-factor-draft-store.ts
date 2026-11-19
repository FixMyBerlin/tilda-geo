import { create } from 'zustand'

/** Unsaved edits of the active variant, shared between sibling panels. */
type SpaceFinderFactorDraftStore = {
  /**
   * True from a factor edit until its auto-save has landed (`FactorEditorPanel`).
   * Lives here so `RunButton` (a sibling) can block a run until the server has the
   * draft. Otherwise the job would score the previous saved config.
   */
  factorSavePending: boolean
  /**
   * Square meters being typed into „Mindestgröße“, before blur saves them on the variant.
   * `null`: the map uses `factorConfig.min_area_m2`. `0`: the field was cleared, so the map
   * does not fall back to the saved number. The URL only stores whether the filter is on.
   */
  minAreaDraft: number | null
  /** Count being typed into »Beste Standorte«, like `minAreaDraft`; the URL holds `space.top`. */
  topDraft: number | null
  actions: {
    setFactorSavePending: (pending: boolean) => void
    setMinAreaDraft: (draft: number | null) => void
    setTopDraft: (draft: number | null) => void
  }
}

const useSpaceFinderFactorDraftStore = create<SpaceFinderFactorDraftStore>()((set) => ({
  factorSavePending: false,
  minAreaDraft: null,
  topDraft: null,
  actions: {
    setFactorSavePending: (pending) =>
      set((state) =>
        state.factorSavePending === pending ? state : { factorSavePending: pending },
      ),
    setMinAreaDraft: (draft) =>
      set((state) => (state.minAreaDraft === draft ? state : { minAreaDraft: draft })),
    setTopDraft: (draft) =>
      set((state) => (state.topDraft === draft ? state : { topDraft: draft })),
  },
}))

export const useSpaceFinderFactorSavePending = () =>
  useSpaceFinderFactorDraftStore((state) => state.factorSavePending)
export const useSpaceFinderMinAreaDraft = () =>
  useSpaceFinderFactorDraftStore((state) => state.minAreaDraft)

export const useSpaceFinderTopDraft = () =>
  useSpaceFinderFactorDraftStore((state) => state.topDraft)

export const useSpaceFinderFactorDraftActions = () =>
  useSpaceFinderFactorDraftStore((state) => state.actions)
