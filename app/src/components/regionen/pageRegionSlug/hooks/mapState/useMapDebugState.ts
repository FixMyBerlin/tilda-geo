import { create } from 'zustand'
import { isDev, isStaging } from '@/components/shared/utils/isEnv'

// INFO DEBUGGING: We could use a middleware to log state changes https://github.com/pmndrs/zustand#middleware

export type Store = {
  showDebugInfo: boolean
  debugLayerStyles: boolean
  useDebugCachelessTiles: boolean
  actions: {
    setShowDebugInfo: (showDebugInfo: Store['showDebugInfo']) => void
    toggleShowDebugInfo: () => void
    setDebugLayerStyles: (debugLayerStyles: Store['debugLayerStyles']) => void
    setUseDebugCachelessTiles: (useDebugCachelessTiles: Store['useDebugCachelessTiles']) => void
  }
}

const useMapDebugState = create<Store>()((set, get) => ({
  showDebugInfo: isDev || isStaging,
  debugLayerStyles: false,
  useDebugCachelessTiles: false,
  actions: {
    setShowDebugInfo: (showDebugInfo) => set({ showDebugInfo }),
    toggleShowDebugInfo: () => {
      const { showDebugInfo } = get()
      set({ showDebugInfo: !showDebugInfo })
    },
    setDebugLayerStyles: (debugLayerStyles) => set({ debugLayerStyles }),
    setUseDebugCachelessTiles: (useDebugCachelessTiles) => set({ useDebugCachelessTiles }),
  },
}))

export const useMapDebugShowDebugInfo = () => useMapDebugState((state) => state.showDebugInfo)
export const useMapDebugDebugLayerStyles = () => useMapDebugState((state) => state.debugLayerStyles)
export const useMapDebugUseDebugCachelessTiles = () =>
  useMapDebugState((state) => state.useDebugCachelessTiles)

export const useMapDebugActions = () => useMapDebugState((state) => state.actions)
