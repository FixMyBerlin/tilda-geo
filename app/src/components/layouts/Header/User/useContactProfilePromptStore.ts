import { create } from 'zustand'

type ContactProfilePromptState = {
  dismissedForSession: boolean
  actions: {
    dismissForSession: () => void
  }
}

const useContactProfilePromptStore = create<ContactProfilePromptState>()((set) => ({
  dismissedForSession: false,
  actions: {
    dismissForSession: () => set({ dismissedForSession: true }),
  },
}))

export const useContactProfilePromptDismissed = () =>
  useContactProfilePromptStore((s) => s.dismissedForSession)

export const useContactProfilePromptActions = () => useContactProfilePromptStore((s) => s.actions)
