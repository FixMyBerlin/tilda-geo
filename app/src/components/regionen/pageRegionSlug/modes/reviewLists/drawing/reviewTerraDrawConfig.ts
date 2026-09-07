import type { GeoJSONStoreFeatures, HexColor } from 'terra-draw'
import {
  TerraDrawLineStringMode,
  TerraDrawPointMode,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
} from 'terra-draw'
import { modeIdentity } from '@/components/regionen/pageRegionSlug/modes/modeIdentity'
import { REVIEW_ENTRY_MOVE_COLOR } from '../reviewEntryMapColors'
import type { ReviewGeometryFamily } from './reviewGeometryParts'

/** Review drawing palette (mode accent, in-progress sky, move orange). */
const COLORS = {
  draw: modeIdentity.reviewLists.accent as HexColor,
  point: '#0ea5e9' as HexColor, // sky-500
  move: REVIEW_ENTRY_MOVE_COLOR as HexColor,
}

const drawColor = (feature: GeoJSONStoreFeatures) => {
  if (feature.properties?.currentlyDrawing) return COLORS.point
  if (feature.properties?.reviewEdit) return COLORS.move
  return COLORS.draw
}

const selectMoveStyles = {
  selectedPointColor: COLORS.move,
  selectedPointWidth: 6,
  selectedPointOutlineColor: '#ffffff' as HexColor,
  selectedPointOutlineWidth: 2,
  selectedLineStringColor: COLORS.move,
  selectedLineStringWidth: 3,
  selectedPolygonColor: COLORS.move,
  selectedPolygonFillOpacity: 0.3,
  selectedPolygonOutlineColor: COLORS.move,
  selectedPolygonOutlineWidth: 3,
  selectionPointColor: COLORS.move,
  selectionPointWidth: 6,
  selectionPointOutlineColor: '#ffffff' as HexColor,
  selectionPointOutlineWidth: 2,
  midPointColor: COLORS.move,
  midPointWidth: 4,
  midPointOutlineColor: '#ffffff' as HexColor,
  midPointOutlineWidth: 1,
}

/** Point + line + polygon draw modes, plus select/edit. */
export const createReviewTerraDrawModes = () => [
  new TerraDrawPointMode({
    styles: {
      pointColor: (feature) => (feature.properties?.reviewEdit ? COLORS.move : COLORS.point),
      pointWidth: 6,
    },
  }),
  new TerraDrawLineStringMode({
    styles: { lineStringColor: drawColor, lineStringWidth: 3 },
  }),
  new TerraDrawPolygonMode({
    pointerDistance: 12,
    styles: { fillColor: drawColor, fillOpacity: 0.3, outlineColor: drawColor },
  }),
  new TerraDrawSelectMode({
    pointerDistance: 12,
    flags: {
      point: { feature: { draggable: true, coordinates: { draggable: true } } },
      linestring: {
        feature: { draggable: true, coordinates: { draggable: true, midpoints: true } },
      },
      polygon: {
        feature: { draggable: true, coordinates: { draggable: true, midpoints: true } },
      },
    },
    styles: selectMoveStyles,
  }),
]

/** Toolbar / TerraDraw mode keys for the review drawing session. */
export const REVIEW_DRAW_MODE = {
  point: 'point',
  linestring: 'linestring',
  polygon: 'polygon',
  select: 'select',
} as const

export type ReviewDrawMode = (typeof REVIEW_DRAW_MODE)[keyof typeof REVIEW_DRAW_MODE]

export const reviewDrawModeForFamily = (family: ReviewGeometryFamily) => REVIEW_DRAW_MODE[family]
