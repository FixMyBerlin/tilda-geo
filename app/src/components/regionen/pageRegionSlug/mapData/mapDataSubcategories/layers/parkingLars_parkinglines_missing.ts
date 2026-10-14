import type { StyleLayer } from './utils/types'

export const layers_parkingLars_parkinglines_missing: StyleLayer[] = [
  {
    id: 'not expected',
    type: 'line',
    filter: ['match', ['get', 'capacity_status'], ['data_missing'], true, false],
    paint: {
      'line-color': 'hsl(297, 100%, 25%)',
      'line-opacity': [
        'match',
        ['get', 'highway'],
        ['secondary', 'construction', 'pedestrian'],
        0.25,
        1,
      ],
      'line-width': ['interpolate', ['linear'], ['zoom'], 16, 2, 20, 10],
    },
  },
]
