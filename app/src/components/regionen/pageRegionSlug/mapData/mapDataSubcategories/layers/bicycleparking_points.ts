import type { StyleLayer } from './utils/types'

export const layers_bicycleparking_points: StyleLayer[] = [
  {
    id: 'bicycleparking-points',
    type: 'symbol',
    layout: {
      'icon-image': [
        'match',
        ['get', 'covered'],
        ['no', 'implicit_no'],
        'parking',
        ['yes', 'partial'],
        'parking-garage',
        'dot-11',
      ],
    },
    paint: {},
  },
]
