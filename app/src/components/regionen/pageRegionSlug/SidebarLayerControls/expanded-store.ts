import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Which sidebar disclosures (long legends, static dataset info rows) the user has expanded in
 * this browser tab. Session-only (sessionStorage), not URL — defaults to collapsed.
 */
type ExpandedStore = {
  expandedKeys: Record<string, true>
  actions: {
    expand: (key: string) => void
    collapse: (key: string) => void
  }
}

const useExpandedStore = create<ExpandedStore>()(
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
      name: 'fmc-sidebar-expanded',
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

export const useExpanded = (key: string) =>
  useExpandedStore((state) => Boolean(state.expandedKeys[key]))

export const useExpandedActions = () => useExpandedStore((state) => state.actions)
