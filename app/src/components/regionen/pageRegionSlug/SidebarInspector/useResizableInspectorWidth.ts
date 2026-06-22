import { type PointerEvent as ReactPointerEvent, useLayoutEffect, useRef } from 'react'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useElementSize } from '@/components/shared/hooks/useElementSize'
import {
  clampInspectorWidth,
  readInspectorWidth,
  writeInspectorWidth,
} from './inspectorWidthStorage'

type UseResizableInspectorWidthOptions = {
  enabled: boolean
  isOpen: boolean
}

const setInspectorWidthCssVar = (width: number) =>
  document.documentElement.style.setProperty('--inspector-width', `${width}px`)

// Desktop inspector: the --inspector-width CSS var drives the panel width and the map-chrome offset.
// The size observer only mirrors the measured panel into map state (used for fitBounds geometry).
export function useResizableInspectorWidth({ enabled, isOpen }: UseResizableInspectorWidthOptions) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const { updateInspectorSize } = useMapActions()

  const active = enabled && isOpen
  const activeRef = useRef(active)
  activeRef.current = active

  const ref = useElementSize<HTMLDivElement>(
    (size) => {
      if (activeRef.current) updateInspectorSize(size)
    },
    { elementRef: panelRef },
  )

  // Seed/reset the CSS var (and map state) before paint so the panel and map chrome stay in sync.
  useLayoutEffect(
    function syncInspectorWidthCssVar() {
      if (!active) {
        setInspectorWidthCssVar(0)
        updateInspectorSize({ width: 0, height: 0 })
        return
      }

      const width = readInspectorWidth()
      setInspectorWidthCssVar(width)
      const height = panelRef.current?.getBoundingClientRect().height ?? 0
      updateInspectorSize({ width, height })
    },
    [active, updateInspectorSize],
  )

  // Persist on drag end only: every gesture ends in pointerup/pointercancel, so the stored value
  // always reflects the user's final width. The CSS var resizes the panel live during the drag;
  // the size observer then mirrors the measured size into map state.
  const onResizeHandlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current
    if (!enabled || !panel) return

    event.preventDefault()
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)

    const startX = event.clientX
    const startWidth = panel.offsetWidth
    let currentWidth = startWidth

    const onPointerMove = (move: globalThis.PointerEvent) => {
      currentWidth = clampInspectorWidth(startWidth + (startX - move.clientX))
      setInspectorWidthCssVar(currentWidth)
    }

    const end = () => {
      handle.removeEventListener('pointermove', onPointerMove)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
      writeInspectorWidth(currentWidth)
    }

    handle.addEventListener('pointermove', onPointerMove)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
  }

  return { ref, onResizeHandlePointerDown }
}
