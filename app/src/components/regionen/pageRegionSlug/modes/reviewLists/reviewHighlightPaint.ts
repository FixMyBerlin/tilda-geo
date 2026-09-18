import { modeIdentity } from '@/components/regionen/pageRegionSlug/modes/modeIdentity'
import {
  modeHighlightOpacity,
  modeHighlightShadowPx,
} from '@/components/regionen/pageRegionSlug/modes/notes/noteSelectRingPaint'

const color = modeIdentity.reviewLists.accent.hex
/** Area outline stroke; line halo is twice this so it matches on both sides of the centerline. */
const reviewHighlightAreaStrokePx = 12

/** Same disc as Hinweise (`noteHighlightCirclePaint`), teal accent. */
export const reviewHighlightCirclePaint = {
  'circle-color': color,
  'circle-opacity': modeHighlightOpacity,
  'circle-radius': modeHighlightShadowPx,
  'circle-stroke-width': 0,
} as const

/** Wide line under LineString / MultiLineString (diameter vs area stroke radius). */
export const reviewHighlightLinePaint = {
  'line-color': color,
  'line-opacity': modeHighlightOpacity,
  'line-width': reviewHighlightAreaStrokePx * 2,
} as const

/**
 * Polygon outline moved outward. Offset is half the stroke so the inner edge sits on the ring
 * (`line-offset` negative = outset).
 */
export const reviewHighlightAreaLinePaint = {
  'line-color': color,
  'line-opacity': modeHighlightOpacity,
  'line-width': reviewHighlightAreaStrokePx,
  'line-offset': -reviewHighlightAreaStrokePx / 2,
} as const
