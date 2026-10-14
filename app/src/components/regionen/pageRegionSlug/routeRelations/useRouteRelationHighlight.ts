import { create } from 'zustand'
import type { RouteRelationHighlight } from './routeRelations'

type Store = {
  hovered: RouteRelationHighlight | null
  actions: {
    setHovered: (hovered: RouteRelationHighlight | null) => void
  }
}

const useRouteRelationHighlightStore = create<Store>()((set) => ({
  hovered: null,
  actions: {
    setHovered: (hovered) => set({ hovered }),
  },
}))

export const useHoveredRouteRelation = () =>
  useRouteRelationHighlightStore((state) => state.hovered)

export const useRouteRelationHighlightActions = () =>
  useRouteRelationHighlightStore((state) => state.actions)
