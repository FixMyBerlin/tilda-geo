import { type PointerEvent as ReactPointerEvent, useRef } from 'react'
import {
  getLayerControlsOpen,
  useLayerControlsActions,
} from '@/components/regionen/pageRegionSlug/SidebarLayerControls/layer-controls-store'
import { useModePanelWidthActions } from './mode-panel-width-store'
import {
  clampModePanelWidth,
  MAP_REMAINING_MIN,
  writeModePanelWidth,
} from './modePanelWidthStorage'
import { useOptimisticMode } from './useCurrentMode'

type UseResizableModePanelWidthOptions = {
  enabled: boolean
}

// Desktop mode panel: width lives in the zustand store. Inactive (mobile) keeps the overlay
// from shoving viewport-fixed map chrome.
export function useResizableModePanelWidth({ enabled }: UseResizableModePanelWidthOptions) {
  const panelRef = useRef<HTMLElement>(null)
  const { resize, startDrag, endDrag } = useModePanelWidthActions()
  const mode = useOptimisticMode()
  const { foldForLayout } = useLayerControlsActions()

  const onResizeHandlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current
    if (!enabled || !panel) return

    event.preventDefault()
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)
    startDrag()

    const startX = event.clientX
    const startWidth = panel.offsetWidth
    let currentWidth = startWidth
    let autoFolded = false

    const maybeAutoFoldCategories = (width: number) => {
      if (autoFolded || !getLayerControlsOpen(mode)) return
      const viewportWidth = window.innerWidth
      if (viewportWidth - width < MAP_REMAINING_MIN) {
        autoFolded = true
        foldForLayout(mode)
      }
    }

    const onPointerMove = (move: globalThis.PointerEvent) => {
      currentWidth = clampModePanelWidth(startWidth + (startX - move.clientX), window.innerWidth)
      resize(currentWidth)
      maybeAutoFoldCategories(currentWidth)
    }

    const end = () => {
      handle.removeEventListener('pointermove', onPointerMove)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
      endDrag()
      writeModePanelWidth(currentWidth)
    }

    handle.addEventListener('pointermove', onPointerMove)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
  }

  return { panelRef, onResizeHandlePointerDown }
}
