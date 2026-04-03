import type { GeoJSONStoreFeatures, HexColor } from 'terra-draw'
import { TerraDrawPolygonMode, TerraDrawSelectMode } from 'terra-draw'

/** Keep calculator styling in the established purple / fuchsia palette. */
const COLORS = {
  drawing: '#a21caf' as HexColor,
  unselected: '#6d28d9' as HexColor,
  selected: '#a21caf' as HexColor,
  selectionPoint: '#ec407a' as HexColor,
  midPoint: '#a855f7' as HexColor,
}

const colorByDrawingState = (feature: GeoJSONStoreFeatures) =>
  feature.properties?.currentlyDrawing ? COLORS.drawing : COLORS.unselected

/**
 * Polygon draw + select/edit only. Extend with more `TerraDraw*Mode`s when adding tools.
 */
export const createCalculatorTerraDrawModes = () => [
  new TerraDrawPolygonMode({
    styles: {
      fillColor: colorByDrawingState,
      fillOpacity: 0.3,
      outlineColor: colorByDrawingState,
    },
  }),
  new TerraDrawSelectMode({
    pointerDistance: 12,
    flags: {
      polygon: {
        feature: {
          draggable: true,
          coordinates: {
            draggable: true,
            midpoints: true,
          },
        },
      },
    },
    styles: {
      selectedPolygonColor: COLORS.selected,
      selectedPolygonFillOpacity: 0.3,
      selectedPolygonOutlineColor: COLORS.selected,
      selectionPointColor: COLORS.selectionPoint,
      selectionPointOpacity: 0.95,
      selectionPointOutlineColor: COLORS.selectionPoint,
      selectionPointOutlineOpacity: 0.95,
      selectionPointOutlineWidth: 2,
      selectionPointWidth: 7,
      midPointColor: COLORS.midPoint,
      midPointOpacity: 0.95,
      midPointOutlineColor: COLORS.midPoint,
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
