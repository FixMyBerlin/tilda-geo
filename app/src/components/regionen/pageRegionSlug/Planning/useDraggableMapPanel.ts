import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'

const EDGE_PX = 8
const MIN_HEIGHT_PX = 56
const DRAG_THRESHOLD_PX = 4

type PanelOffset = { left: number; top: number }

type DragSession = {
  pointerId: number
  startX: number
  startY: number
  originLeft: number
  originTop: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const mapBoundsOf = (panel: HTMLElement) => {
  const parent = panel.offsetParent
  if (!(parent instanceof HTMLElement)) return null
  return parent.getBoundingClientRect()
}

const clampOffset = (panel: HTMLElement, offset: PanelOffset) => {
  const parentBox = mapBoundsOf(panel)
  if (!parentBox) return offset
  const maxLeft = Math.max(EDGE_PX, parentBox.width - panel.offsetWidth - EDGE_PX)
  const maxTop = Math.max(EDGE_PX, parentBox.height - MIN_HEIGHT_PX - EDGE_PX)
  return {
    left: clamp(offset.left, EDGE_PX, maxLeft),
    top: clamp(offset.top, EDGE_PX, maxTop),
  }
}

const maxHeightForTop = (panel: HTMLElement, top: number) => {
  const parentBox = mapBoundsOf(panel)
  if (!parentBox) return undefined
  return Math.max(MIN_HEIGHT_PX, parentBox.height - top - EDGE_PX)
}

/**
 * Press-and-drag a map overlay (title-bar style). The panel only moves while the
 * pointer is held down; release drops it. Clamped to the map box; lowering it
 * shrinks max-height so the body stays scrollable.
 */
export const useDraggableMapPanel = (active: boolean) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const didDragRef = useRef(false)
  const sessionRef = useRef<DragSession | null>(null)
  const [offset, setOffset] = useState<PanelOffset | null>(null)
  const [maxHeight, setMaxHeight] = useState<number>()
  const [dragging, setDragging] = useState(false)

  useEffect(
    function keepPanelInsideMapBounds() {
      if (!active) return
      const panel = panelRef.current
      if (!panel) return

      const update = () => {
        const parentBox = mapBoundsOf(panel)
        if (!parentBox) return
        const panelBox = panel.getBoundingClientRect()
        const top = panelBox.top - parentBox.top
        setMaxHeight(maxHeightForTop(panel, top))
        setOffset((current) => {
          if (!current) return current
          const next = clampOffset(panel, current)
          if (next.left === current.left && next.top === current.top) return current
          return next
        })
      }

      update()
      const observer = new ResizeObserver(update)
      const parent = panel.offsetParent
      if (parent instanceof HTMLElement) observer.observe(parent)
      observer.observe(panel)
      window.addEventListener('resize', update)
      return function stopKeepingPanelInsideMapBounds() {
        observer.disconnect()
        window.removeEventListener('resize', update)
      }
    },
    [active],
  )

  const endDrag = (handle: HTMLElement, pointerId: number) => {
    sessionRef.current = null
    setDragging(false)
    if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId)
  }

  const onHeaderPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    if (event.target instanceof Element && event.target.closest('[data-drag-ignore]')) return

    const panel = panelRef.current
    const parentBox = panel ? mapBoundsOf(panel) : null
    if (!panel || !parentBox) return

    const panelBox = panel.getBoundingClientRect()
    didDragRef.current = false
    sessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: panelBox.left - parentBox.left,
      originTop: panelBox.top - parentBox.top,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onHeaderPointerMove = (event: PointerEvent<HTMLElement>) => {
    const session = sessionRef.current
    const panel = panelRef.current
    if (!session || !panel || event.pointerId !== session.pointerId) return
    // Mouse released (or captured event went stale) — never keep following the cursor.
    if (event.buttons === 0) {
      endDrag(event.currentTarget, event.pointerId)
      return
    }

    const dx = event.clientX - session.startX
    const dy = event.clientY - session.startY
    if (!didDragRef.current) {
      if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return
      didDragRef.current = true
      setDragging(true)
    }
    const next = clampOffset(panel, {
      left: session.originLeft + dx,
      top: session.originTop + dy,
    })
    setOffset(next)
    setMaxHeight(maxHeightForTop(panel, next.top))
  }

  const onHeaderPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (sessionRef.current?.pointerId !== event.pointerId) return
    endDrag(event.currentTarget, event.pointerId)
  }

  return {
    panelRef,
    dragging,
    didDragRef,
    panelStyle: {
      ...(offset ? { left: offset.left, top: offset.top } : {}),
      ...(maxHeight != null ? { maxHeight } : {}),
    } satisfies CSSProperties,
    defaultPositionClassName: offset ? undefined : 'top-2.5 left-[17rem]',
    headerDragProps: {
      onPointerDown: onHeaderPointerDown,
      onPointerMove: onHeaderPointerMove,
      onPointerUp: onHeaderPointerUp,
      onPointerCancel: onHeaderPointerUp,
      onLostPointerCapture: onHeaderPointerUp,
    },
  }
}
