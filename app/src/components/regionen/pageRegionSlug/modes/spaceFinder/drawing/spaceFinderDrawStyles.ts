import type { DrawStyles } from '@osm-editor-kit/react-map-gl-draw'
import type { ExpressionSpecification } from 'maplibre-gl'

/** Blue palette, matching the planning boundary highlight (#2563eb). */
const SPACE_FINDER_DRAW_COLORS = {
  area: '#2563eb',
  selected: '#1d4ed8',
  corner: '#3b82f6',
  midpoint: '#60a5fa',
}

const isActive: ExpressionSpecification = ['boolean', ['get', 'active'], false]

const areaColor: ExpressionSpecification = [
  'case',
  ['boolean', ['get', 'selected'], false],
  SPACE_FINDER_DRAW_COLORS.selected,
  SPACE_FINDER_DRAW_COLORS.area,
]

export const spaceFinderDrawStyles = {
  fill: { paint: { 'fill-color': areaColor, 'fill-opacity': 0.15 } },
  line: { paint: { 'line-color': areaColor, 'line-width': 3 } },
  vertex: {
    paint: {
      'circle-radius': ['case', ['any', isActive, ['boolean', ['get', 'closing'], false]], 9, 7],
      'circle-color': SPACE_FINDER_DRAW_COLORS.corner,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  },
  midpoint: {
    paint: {
      'circle-radius': ['case', isActive, 6, 4],
      'circle-color': SPACE_FINDER_DRAW_COLORS.midpoint,
      'circle-opacity': 0.95,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1,
    },
  },
} satisfies DrawStyles
