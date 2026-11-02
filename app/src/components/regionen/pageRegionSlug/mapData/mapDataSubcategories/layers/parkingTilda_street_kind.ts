import type { StyleLayer } from './utils/types'

export const layers_parkingTilda_street_kind: StyleLayer[] = [
  {
    id: 'street_kind',
    type: 'line',
    filter: ['has', 'capacity'],
    paint: {
      'line-color': [
        'match',
        ['get', 'parking'],
        ['street_side'],
        'rgb(105, 77, 81)',
        ['shoulder'],
        'rgb(161, 142, 119)',
        ['half_on_kerb'],
        'rgb(177, 171, 174)',
        ['on_kerb'],
        'rgb(107, 117, 165)',
        'rgb(206, 189, 134)',
      ],
      'line-opacity': ['case', ['match', ['get', 'staggered'], ['yes'], true, false], 0.5, 1],
      'line-width': ['interpolate', ['linear'], ['zoom'], 15, 2, 20, 16],
    },
  },
]
