import type { StyleLayer } from './utils/types'

export const layers_parkingLars_debug_parking_poly: StyleLayer[] = [
  {
    id: 'parking-poly-area',
    type: 'fill',
    minzoom: 15,
    paint: {
      'fill-color': 'hsla(208, 47%, 38%, 0.7)',
    },
  },
  {
    id: 'parking-poly-border',
    type: 'line',
    minzoom: 16.5,
    paint: {
      'line-color': 'rgb(0, 0, 0)',
      'line-dasharray': [2, 2],
    },
  },
]
