import type { DrawFeature } from '@osm-editor-kit/react-map-gl-draw'
import { create } from 'zustand'

export type ReviewComposeType = 'point' | 'line' | 'polygon'

type ReviewDrawStore = {
  /** Geometry type picked in the compose toolbar. */
  composeType: ReviewComposeType
  /** The new entry's shape until it is saved; stays editable when saving fails. */
  composeFeatures: DrawFeature[]
  actions: {
    setComposeType: (type: ReviewComposeType) => void
    setComposeFeatures: (features: DrawFeature[]) => void
    resetCompose: () => void
  }
}

const useReviewDrawStore = create<ReviewDrawStore>()((set) => ({
  composeType: 'point',
  composeFeatures: [],
  actions: {
    setComposeType: (composeType) => set({ composeType }),
    setComposeFeatures: (composeFeatures) => set({ composeFeatures }),
    resetCompose: () =>
      set((state) =>
        state.composeType === 'point' && state.composeFeatures.length === 0
          ? state
          : { composeType: 'point', composeFeatures: [] },
      ),
  },
}))

export const useReviewComposeType = () => useReviewDrawStore((state) => state.composeType)
export const useReviewComposeFeatures = () => useReviewDrawStore((state) => state.composeFeatures)
export const useReviewDrawActions = () => useReviewDrawStore((state) => state.actions)
