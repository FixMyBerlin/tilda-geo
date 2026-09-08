import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Which long legends (>3 items) the user has expanded in this browser tab.
 * Session-only (sessionStorage), not URL — defaults to collapsed.
 */
type LegendExpandedStore = {
  expandedKeys: Record<string, true>
  actions: {
    expand: (key: string) => void
    collapse: (key: string) => void
  }
}

const useLegendExpandedStore = create<LegendExpandedStore>()(
  persist(
    (set) => ({
      expandedKeys: {},
      actions: {
        expand: (key) =>
          set((state) =>
            state.expandedKeys[key]
              ? state
              : { expandedKeys: { ...state.expandedKeys, [key]: true } },
          ),
        collapse: (key) =>
          set((state) => {
            if (!state.expandedKeys[key]) return state
            const { [key]: _removed, ...expandedKeys } = state.expandedKeys
            return { expandedKeys }
          }),
      },
    }),
    {
      name: 'fmc-legend-expanded',
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
      partialize: (state) => ({ expandedKeys: state.expandedKeys }),
    },
  ),
)

export const useLegendExpanded = (key: string) =>
  useLegendExpandedStore((state) => Boolean(state.expandedKeys[key]))

export const useLegendExpandedActions = () => useLegendExpandedStore((state) => state.actions)
