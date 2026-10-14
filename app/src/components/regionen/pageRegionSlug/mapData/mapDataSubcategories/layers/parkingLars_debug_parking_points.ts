import type { StyleLayer } from './utils/types'

export const layers_parkingLars_debug_parking_points: StyleLayer[] = [
  {
    id: 'parking-point-area',
    type: 'fill',
    paint: {
      'fill-color': 'rgba(80, 139, 134, 0.7)',
    },
  },
  {
    id: 'parking-point-border',
    type: 'line',
    minzoom: 16.5,
    paint: {
      'line-color': 'rgb(0, 0, 0)',
      'line-dasharray': [2, 2],
    },
  },
]
