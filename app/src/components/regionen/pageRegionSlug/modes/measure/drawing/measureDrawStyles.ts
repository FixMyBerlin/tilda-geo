import type { DrawStyles } from '@osm-editor-kit/react-map-gl-draw'
import type { ExpressionSpecification } from 'maplibre-gl'

/**
 * The orange of the mode. The shapes get a white casing (see `MeasureMapDrawing`) because
 * they are read on aerial images.
 */
export const MEASURE_DRAW_COLORS = {
  shape: '#c2410c',
  active: '#ea580c',
  corner: '#ffffff',
}

const isActive: ExpressionSpecification = ['boolean', ['get', 'active'], false]

const shapeColor: ExpressionSpecification = [
  'case',
  ['any', ['==', ['get', 'role'], 'draft'], ['boolean', ['get', 'selected'], false]],
  MEASURE_DRAW_COLORS.active,
  MEASURE_DRAW_COLORS.shape,
]

export const measureDrawStyles = {
  fill: { paint: { 'fill-color': shapeColor, 'fill-opacity': 0.2 } },
  line: { paint: { 'line-color': shapeColor, 'line-width': 3 } },
  vertex: {
    paint: {
      'circle-radius': ['case', ['any', isActive, ['boolean', ['get', 'closing'], false]], 8, 6],
      'circle-color': MEASURE_DRAW_COLORS.corner,
      'circle-stroke-color': MEASURE_DRAW_COLORS.active,
      'circle-stroke-width': 2.5,
    },
  },
  midpoint: {
    paint: {
      'circle-radius': ['case', isActive, 5, 3.5],
      'circle-color': MEASURE_DRAW_COLORS.active,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1.5,
    },
  },
} satisfies DrawStyles
