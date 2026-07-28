import { create } from 'zustand'
import type { TodoId } from '@/data/processingTypes/todoId.generated.const'

type MaprouletteTasksStore = {
  openProjectKey: TodoId | null | undefined
  actions: {
    setOpenProjectKey: (key: TodoId | null) => void
  }
}

const useMaprouletteTasksStore = create<MaprouletteTasksStore>()((set) => ({
  openProjectKey: undefined,
  actions: {
    setOpenProjectKey: (key) =>
      set((state) => (state.openProjectKey === key ? state : { openProjectKey: key })),
  },
}))

export const resolveTaskDisclosureOpen = (
  projectKey: TodoId,
  allKeys: TodoId[],
  stored: TodoId | null | undefined,
) => {
  if (stored !== undefined) {
    if (stored === null) return false
    if (allKeys.includes(stored)) return projectKey === stored
  }
  return allKeys.length === 1 && allKeys[0] === projectKey
}

export const useMaprouletteOpenProjectKey = () =>
  useMaprouletteTasksStore((state) => state.openProjectKey)

export const useMaprouletteTasksActions = () => useMaprouletteTasksStore((state) => state.actions)
