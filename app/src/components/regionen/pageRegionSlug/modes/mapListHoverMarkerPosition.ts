type Point = { x: number; y: number }
type Size = { width: number; height: number }

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export type EdgeSide = 'left' | 'right' | 'top' | 'bottom'

/** In-view list-hover ring, aligned with the selected-point halo. */
export const LIST_HOVER_RING_PX = 22
/** Off-screen ring: 3× the in-view marker so it reads at the map edge. */
export const LIST_HOVER_EDGE_RING_PX = LIST_HOVER_RING_PX * 3
/** Fraction of the edge-ring diameter that hangs outside the map and is clipped. */
const LIST_HOVER_EDGE_CUTOFF = 0.4

/**
 * Inset of the ring center from a clamped edge so `cutoff` of the diameter sits outside
 * the container (`overflow: hidden` clips it).
 */
export const edgeMarkerCenterInset = (
  size = LIST_HOVER_EDGE_RING_PX,
  cutoff = LIST_HOVER_EDGE_CUTOFF,
) => size * (0.5 - cutoff)

export type ListHoverMarkerPosition = Point & {
  /** True when the item is outside the visible map and the position was clamped to the edge. */
  atEdge: boolean
  /** Which viewport edges the projected point lies outside of (may be multiple at corners). */
  edges: Record<EdgeSide, boolean>
}

/**
 * Projected pixel position for a hovered mode-list item (see <MapListHoverMarker>).
 * Uses the list row's coordinates — the map feature does not need to be loaded.
 * In view: the ring sits on the projected point. Off-screen: clamped to the container
 * edge (`atEdge: true`), `margin` px inset so the large edge ring is ~40% clipped.
 */
export const listHoverMarkerPosition = (
  projected: Point,
  container: Size,
  margin = edgeMarkerCenterInset(),
) => {
  const edges = {
    left: projected.x < 0,
    right: projected.x > container.width,
    top: projected.y < 0,
    bottom: projected.y > container.height,
  } satisfies Record<EdgeSide, boolean>

  return {
    x: clamp(projected.x, margin, container.width - margin),
    y: clamp(projected.y, margin, container.height - margin),
    atEdge: edges.left || edges.right || edges.top || edges.bottom,
    edges,
  } satisfies ListHoverMarkerPosition
}

/** Pixel nudge toward the off-screen side(s) for the edge-marker jump. */
export const edgeJumpOffset = (edges: Record<EdgeSide, boolean>, distance = 8) =>
  ({
    x: (edges.left ? -distance : 0) + (edges.right ? distance : 0),
    y: (edges.top ? -distance : 0) + (edges.bottom ? distance : 0),
  }) satisfies Point
