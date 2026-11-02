import type { StyleLayer } from './utils/types'

export const layers_parkingLars_obstacles: StyleLayer[] = [
  {
    id: 'area',
    type: 'fill',
    minzoom: 15,
    paint: {
      'fill-color': 'rgb(219, 39, 119)',
    },
  },
  {
    id: 'border',
    type: 'line',
    minzoom: 16.5,
    paint: {
      'line-color': 'rgb(0, 0, 0)',
      'line-dasharray': [2, 2],
    },
  },
]
