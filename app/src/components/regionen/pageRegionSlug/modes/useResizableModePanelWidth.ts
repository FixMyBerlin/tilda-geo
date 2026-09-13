import { type PointerEvent as ReactPointerEvent, useEffect, useLayoutEffect, useRef } from 'react'
import {
  useLayerControlsActions,
  useLayerControlsOpen,
} from '@/components/regionen/pageRegionSlug/SidebarLayerControls/layer-controls-store'
import { useModePanelWidthActions } from './mode-panel-width-store'
import {
  clampModePanelWidth,
  MAP_REMAINING_MIN,
  readModePanelWidth,
  writeModePanelWidth,
} from './modePanelWidthStorage'

type UseResizableModePanelWidthOptions = {
  enabled: boolean
}

const setModePanelWidthCssVar = (width: number) =>
  document.documentElement.style.setProperty('--mode-panel-width', `${width}px`)

// Desktop mode panel: width lives in the zustand store + CSS var. Inactive (mobile) → 0px so
// viewport-fixed map chrome is not shoved by a nearly full-width overlay panel.
export function useResizableModePanelWidth({ enabled }: UseResizableModePanelWidthOptions) {
  const panelRef = useRef<HTMLElement | null>(null)
  const { resize, startDrag, endDrag, resetFromStorage } = useModePanelWidthActions()
  const layerControlsOpen = useLayerControlsOpen()
  const { foldForLayout } = useLayerControlsActions()
  const layerControlsOpenRef = useRef(layerControlsOpen)
  const autoFoldedThisDragRef = useRef(false)
  useEffect(
    function syncLayerControlsOpenRef() {
      layerControlsOpenRef.current = layerControlsOpen
    },
    [layerControlsOpen],
  )

  useLayoutEffect(
    function syncModePanelWidthFromStorage() {
      resetFromStorage()
      if (!enabled) {
        setModePanelWidthCssVar(0)
        return
      }

      setModePanelWidthCssVar(readModePanelWidth())
    },
    [enabled, resetFromStorage],
  )

  const onResizeHandlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current
    if (!enabled || !panel) return

    event.preventDefault()
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)
    startDrag()
    autoFoldedThisDragRef.current = false

    const startX = event.clientX
    const startWidth = panel.offsetWidth
    let currentWidth = startWidth

    const maybeAutoFoldCategories = (width: number) => {
      if (autoFoldedThisDragRef.current || !layerControlsOpenRef.current) return
      const viewportWidth = window.innerWidth
      if (viewportWidth - width < MAP_REMAINING_MIN) {
        autoFoldedThisDragRef.current = true
        foldForLayout()
      }
    }

    const onPointerMove = (move: globalThis.PointerEvent) => {
      currentWidth = clampModePanelWidth(startWidth + (startX - move.clientX), window.innerWidth)
      resize(currentWidth)
      setModePanelWidthCssVar(currentWidth)
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
