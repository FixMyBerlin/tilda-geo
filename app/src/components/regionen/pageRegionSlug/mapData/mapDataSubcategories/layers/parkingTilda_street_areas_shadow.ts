import type { StyleLayer } from './utils/types'

export const layers_parkingTilda_street_areas_shadow: StyleLayer[] = [
  {
    id: 'area-color',
    type: 'fill',
    paint: {
      'fill-color': 'rgba(97, 143, 168, 0.5)',
      'fill-opacity': 0.15,
    },
  },
  {
    id: 'area-outline',
    type: 'line',
    paint: {
      'line-color': 'rgba(107, 114, 118, 0.5)',
      'line-dasharray': [1, 1],
      'line-opacity': 0.9,
    },
  },
]
