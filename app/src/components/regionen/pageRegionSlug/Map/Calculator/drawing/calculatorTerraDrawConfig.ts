import type { GeoJSONStoreFeatures, HexColor } from 'terra-draw'
import { TerraDrawPolygonMode, TerraDrawSelectMode } from 'terra-draw'

/** Keep calculator styling in the established purple / fuchsia palette. */
export const CALCULATOR_TERRA_COLORS = {
  drawing: '#a21caf' as HexColor,
  unselected: '#6d28d9' as HexColor,
  selected: '#a21caf' as HexColor,
  selectionPoint: '#ec407a' as HexColor,
  midPoint: '#a855f7' as HexColor,
}

const SELECTION_POINT_WIDTH = 7
const SELECTION_POINT_OUTLINE_WIDTH = 2
// Hit area for corners and edge points: a bit larger than the drawn corner, so the cursor
// reacts everywhere the point is visible.
const SELECT_POINTER_DISTANCE = Math.ceil(
  (SELECTION_POINT_WIDTH + SELECTION_POINT_OUTLINE_WIDTH) * 1.2,
)

const colorByDrawingState = (feature: GeoJSONStoreFeatures) =>
  feature.properties?.currentlyDrawing
    ? CALCULATOR_TERRA_COLORS.drawing
    : CALCULATOR_TERRA_COLORS.unselected

/**
 * Polygon draw + select/edit only. Extend with more `TerraDraw*Mode`s when adding tools.
 */
export const createCalculatorTerraDrawModes = () => [
  new TerraDrawPolygonMode({
    pointerDistance: 6,
    styles: {
      fillColor: colorByDrawingState,
      fillOpacity: 0.3,
      outlineColor: colorByDrawingState,
    },
  }),
  new TerraDrawSelectMode({
    pointerDistance: SELECT_POINTER_DISTANCE,
    flags: {
      polygon: {
        feature: {
          draggable: true,
          coordinates: {
            draggable: true,
            // Dragging a midpoint adds the corner and moves it in one gesture.
            midpoints: { draggable: true },
          },
        },
      },
    },
    styles: {
      selectedPolygonColor: CALCULATOR_TERRA_COLORS.selected,
      selectedPolygonFillOpacity: 0.3,
      selectedPolygonOutlineColor: CALCULATOR_TERRA_COLORS.selected,
      selectionPointColor: CALCULATOR_TERRA_COLORS.selectionPoint,
      selectionPointOpacity: 0.95,
      selectionPointOutlineColor: CALCULATOR_TERRA_COLORS.selectionPoint,
      selectionPointOutlineOpacity: 0.95,
      selectionPointOutlineWidth: SELECTION_POINT_OUTLINE_WIDTH,
      selectionPointWidth: SELECTION_POINT_WIDTH,
      midPointColor: CALCULATOR_TERRA_COLORS.midPoint,
      midPointOpacity: 0.95,
      midPointOutlineColor: CALCULATOR_TERRA_COLORS.midPoint,
      midPointOutlineOpacity: 0.95,
      midPointOutlineWidth: 0,
      midPointWidth: 3,
    },
  }),
]

export const CALCULATOR_TERRA_MODE = {
  polygon: 'polygon',
  select: 'select',
} as const
