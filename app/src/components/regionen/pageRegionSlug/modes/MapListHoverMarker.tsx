import { motion } from 'motion/react'
import { Marker } from 'react-map-gl/maplibre'
import { UI_SPRING } from '@/components/shared/motion/spring.const'
import {
  edgeJumpOffset,
  LIST_HOVER_EDGE_RING_PX,
  LIST_HOVER_RING_PX,
} from './mapListHoverMarkerPosition'
import { useHoveredListItem } from './mode-list-store'
import { modeAccentRgba, modeIdentity } from './modeIdentity'
import { useCurrentMode } from './useCurrentMode'
import { useListHoverMarkerPosition } from './useListHoverMarkerPosition'

/**
 * List-hover ring from the row's `[lng, lat]` only (the map feature does not need to be loaded).
 * In-view: Marker on that point. Off-screen: same ring, clamped to the viewport edge.
 */
export const MapListHoverMarker = () => {
  const position = useListHoverMarkerPosition()
  const hoveredListItem = useHoveredListItem()
  const mode = useCurrentMode()
  if (!position || !hoveredListItem) return null

  const accent = modeIdentity[mode].accent
  const size = position.atEdge ? LIST_HOVER_EDGE_RING_PX : LIST_HOVER_RING_PX
  const jump = position.atEdge ? edgeJumpOffset(position.edges) : { x: 0, y: 0 }

  return (
    <Marker
      longitude={position.longitude}
      latitude={position.latitude}
      anchor="center"
      style={{ pointerEvents: 'none' }}
      aria-hidden
    >
      <motion.div
        key={`${hoveredListItem.id}-${position.atEdge ? 'edge' : 'in'}`}
        data-list-hover-marker=""
        initial={position.atEdge ? { scale: 0.55, x: 0, y: 0 } : false}
        animate={{
          scale: 1,
          x: position.atEdge ? [0, jump.x, 0] : 0,
          y: position.atEdge ? [0, jump.y, 0] : 0,
        }}
        transition={{
          scale: UI_SPRING,
          x: { duration: 0.45, times: [0, 0.4, 1], ease: 'easeOut' },
          y: { duration: 0.45, times: [0, 0.4, 1], ease: 'easeOut' },
        }}
        className="rounded-full border-[3px]"
        style={{
          width: size,
          height: size,
          borderColor: accent,
          backgroundColor: modeAccentRgba(accent, position.atEdge ? 0.55 : 0.35),
          boxShadow: `0 0 0 3px rgba(255,255,255,0.9), 0 0 16px ${modeAccentRgba(accent, 0.7)}`,
        }}
      />
    </Marker>
  )
}
