import { motion } from 'motion/react'
import { Marker } from 'react-map-gl/maplibre'
import { UI_SPRING } from '@/components/shared/motion/spring.const'
import { edgeJumpOffset, LIST_HOVER_EDGE_RING_PX } from './mapListHoverMarkerPosition'
import { useHoveredListItem } from './mode-list-store'
import { modeIdentity } from './modeIdentity'
import { useCurrentMode } from './useCurrentMode'
import { useListHoverMarkerPosition } from './useListHoverMarkerPosition'

/**
 * Off-screen list-hover disc: clamped to the map viewport edge from the row's `[lng, lat]`.
 * In-view notes, QA, and Prüflisten use MapLibre highlight paint instead.
 */
export const ModeListHoverEdgeMarker = () => {
  const position = useListHoverMarkerPosition()
  const hoveredListItem = useHoveredListItem()
  const { mode } = useCurrentMode()
  if (!position || !hoveredListItem || !position.atEdge) return null

  const { accent } = modeIdentity[mode]
  const rgba = (alpha: number) => `rgba(${accent.rgb.join(',')}, ${alpha})`
  const jump = edgeJumpOffset(position.edges)

  return (
    <Marker
      longitude={position.longitude}
      latitude={position.latitude}
      anchor="center"
      style={{ pointerEvents: 'none' }}
      aria-hidden
    >
      <motion.div
        key={hoveredListItem.id}
        data-list-hover-edge-marker=""
        initial={{ scale: 0.55, x: 0, y: 0 }}
        animate={{
          scale: 1,
          x: [0, jump.x, 0],
          y: [0, jump.y, 0],
        }}
        transition={{
          scale: UI_SPRING,
          x: { duration: 0.45, times: [0, 0.4, 1], ease: 'easeOut' },
          y: { duration: 0.45, times: [0, 0.4, 1], ease: 'easeOut' },
        }}
        className="rounded-full border-[3px]"
        style={{
          width: LIST_HOVER_EDGE_RING_PX,
          height: LIST_HOVER_EDGE_RING_PX,
          borderColor: accent.hex,
          backgroundColor: rgba(0.55),
          boxShadow: `0 0 0 3px rgba(255,255,255,0.9), 0 0 16px ${rgba(0.7)}`,
        }}
      />
    </Marker>
  )
}
