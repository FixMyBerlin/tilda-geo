import { useMemo } from 'react'
import { create } from 'zustand'

export type InspectorMissingTranslationEntry = {
  missing: string
}

type Store = {
  entriesByMissing: Record<string, InspectorMissingTranslationEntry>
  actions: {
    registerMissingTranslation: (entry: InspectorMissingTranslationEntry) => void
    resetMissingTranslations: () => void
  }
}

const useInspectorMissingTranslationsStore = create<Store>()((set) => ({
  entriesByMissing: {},
  actions: {
    registerMissingTranslation: (entry) =>
      set((state) =>
        state.entriesByMissing[entry.missing]
          ? state
          : {
              entriesByMissing: {
                ...state.entriesByMissing,
                [entry.missing]: entry,
              },
            },
      ),
    resetMissingTranslations: () =>
      set((state) =>
        Object.keys(state.entriesByMissing).length ? { entriesByMissing: {} } : state,
      ),
  },
}))

export const useInspectorMissingTranslationsEntries = () => {
  const entriesByMissing = useInspectorMissingTranslationsStore((state) => state.entriesByMissing)

  return useMemo(
    () => Object.values(entriesByMissing).sort((a, b) => a.missing.localeCompare(b.missing)),
    [entriesByMissing],
  )
}

export const useInspectorMissingTranslationsActions = () =>
  useInspectorMissingTranslationsStore((state) => state.actions)

export const registerInspectorMissingTranslation = (entry: InspectorMissingTranslationEntry) =>
  useInspectorMissingTranslationsStore.getState().actions.registerMissingTranslation(entry)
