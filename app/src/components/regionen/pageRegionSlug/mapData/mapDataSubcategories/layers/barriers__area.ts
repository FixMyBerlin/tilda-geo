import type { StyleLayer } from './utils/types'

export const layers_barriers__area: StyleLayer[] = [
  {
    id: 'barriers_water_aerodrome2',
    type: 'fill',
    beforeId: 'atlas-app-beforeid-below-road',
    paint: {
      'fill-opacity': 0.42,
    },
  },
  {
    id: 'barriers_water_aerodrome',
    type: 'fill',
    beforeId: 'atlas-app-beforeid-below-road',
    paint: {
      'fill-opacity': 0.5,
      'fill-pattern': 'pattern-hatch',
      'fill-translate': [0, 0],
    },
  },
]
