import { useEffect, useRef } from 'react'
import { useIsHoveredMapListItem, useModeListActions } from './mode-list-store'

/** Shared list-row hover, map-hover highlight, and scroll-into-view for mode lists. */
export const useModeListRow = <T extends HTMLElement>(
  id: string,
  coordinates: [number, number],
  active: boolean,
  onClick: () => void,
) => {
  const { hoverListItem, unhoverListItem, clearHoveredListItem } = useModeListActions()
  const hoveredFromMap = useIsHoveredMapListItem(id)
  const ref = useRef<T>(null)

  useEffect(
    function scrollActiveListRowIntoView() {
      if (active) {
        ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    },
    [active],
  )

  const hoverHandlers = {
    onMouseEnter: () => hoverListItem({ id, coordinates }),
    onMouseLeave: () => unhoverListItem(id),
    onFocus: () => hoverListItem({ id, coordinates }),
    onBlur: () => unhoverListItem(id),
  }

  const onActivate = () => {
    clearHoveredListItem()
    onClick()
  }

  return { ref, hoveredFromMap, onActivate, hoverHandlers }
}
