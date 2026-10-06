import type { DrawStyles } from '@osm-editor-kit/react-map-gl-draw'
import type { ExpressionSpecification } from 'maplibre-gl'

/** Keep calculator styling in the established purple / fuchsia palette. */
export const CALCULATOR_DRAW_COLORS = {
  drawing: '#a21caf',
  unselected: '#6d28d9',
  selected: '#a21caf',
  corner: '#ec407a',
  midpoint: '#a855f7',
}

const isActive: ExpressionSpecification = ['boolean', ['get', 'active'], false]

const areaColor: ExpressionSpecification = [
  'case',
  ['==', ['get', 'role'], 'draft'],
  CALCULATOR_DRAW_COLORS.drawing,
  ['boolean', ['get', 'selected'], false],
  CALCULATOR_DRAW_COLORS.selected,
  CALCULATOR_DRAW_COLORS.unselected,
]

export const calculatorDrawStyles = {
  fill: { paint: { 'fill-color': areaColor, 'fill-opacity': 0.3 } },
  line: { paint: { 'line-color': areaColor, 'line-width': 3 } },
  vertex: {
    paint: {
      'circle-radius': ['case', ['any', isActive, ['boolean', ['get', 'closing'], false]], 9, 7],
      'circle-color': CALCULATOR_DRAW_COLORS.corner,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  },
  midpoint: {
    paint: {
      'circle-radius': ['case', isActive, 6, 4],
      'circle-color': CALCULATOR_DRAW_COLORS.midpoint,
      'circle-opacity': 0.95,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
    },
  },
} satisfies DrawStyles
