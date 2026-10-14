import type { StyleLayer } from './utils/types'

export const layers_parkingLars_debug_ramps: StyleLayer[] = [
  {
    id: 'parking-ramps-area',
    type: 'fill',
    minzoom: 15,
    paint: {
      'fill-color': 'rgba(148, 163, 184, 0.7)',
    },
  },
  {
    id: 'parking-ramps-border',
    type: 'line',
    minzoom: 16.5,
    paint: {
      'line-color': 'rgb(0, 0, 0)',
      'line-dasharray': [2, 2],
    },
  },
]
