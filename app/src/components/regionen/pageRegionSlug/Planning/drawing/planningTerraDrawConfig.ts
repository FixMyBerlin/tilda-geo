import type { GeoJSONStoreFeatures, HexColor } from 'terra-draw'
import { TerraDrawPolygonMode, TerraDrawSelectMode } from 'terra-draw'

/** Blue palette, matching the existing planning boundary highlight (#2563eb). */
export const PLANNING_TERRA_COLORS = {
  drawing: '#2563eb' as HexColor,
  unselected: '#2563eb' as HexColor,
  selected: '#1d4ed8' as HexColor,
  selectionPoint: '#3b82f6' as HexColor,
  midPoint: '#60a5fa' as HexColor,
}

const colorByDrawingState = (feature: GeoJSONStoreFeatures) =>
  feature.properties?.currentlyDrawing
    ? PLANNING_TERRA_COLORS.drawing
    : PLANNING_TERRA_COLORS.unselected

/** Polygon draw + select/edit modes for defining a single study area. */
export const createPlanningTerraDrawModes = () => [
  new TerraDrawPolygonMode({
    pointerDistance: 6,
    styles: {
      fillColor: colorByDrawingState,
      fillOpacity: 0.15,
      outlineColor: colorByDrawingState,
    },
  }),
  new TerraDrawSelectMode({
    pointerDistance: 6,
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
      selectedPolygonColor: PLANNING_TERRA_COLORS.selected,
      selectedPolygonFillOpacity: 0.15,
      selectedPolygonOutlineColor: PLANNING_TERRA_COLORS.selected,
      selectionPointColor: PLANNING_TERRA_COLORS.selectionPoint,
      selectionPointOutlineColor: PLANNING_TERRA_COLORS.selectionPoint,
      selectionPointOutlineWidth: 2,
      selectionPointWidth: 7,
      midPointColor: PLANNING_TERRA_COLORS.midPoint,
      midPointOutlineColor: PLANNING_TERRA_COLORS.midPoint,
      midPointWidth: 3,
    },
  }),
]

export const PLANNING_TERRA_MODE = {
  polygon: 'polygon',
  select: 'select',
} as const
