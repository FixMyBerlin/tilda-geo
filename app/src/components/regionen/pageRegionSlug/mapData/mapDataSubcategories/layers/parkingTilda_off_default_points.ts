import type { StyleLayer } from './utils/types'

export const layers_parkingTilda_off_default_points: StyleLayer[] = [
  {
    id: 'off-street-point',
    type: 'circle',
    paint: {
      'circle-color': [
        'case',
        ['match', ['get', 'parking'], ['multi-storey'], true, false],
        'rgb(233, 91, 84)',
        ['match', ['get', 'parking'], ['underground'], true, false],
        'rgb(142, 192, 169)',
        ['match', ['get', 'parking'], ['carports', 'carport'], true, false],
        'rgb(251, 206, 74)',
        ['match', ['get', 'building'], ['garages', 'garage', 'carport'], true, false],
        'rgb(251, 206, 74)',
        'rgb(48, 159, 219)',
      ],
      'circle-stroke-color': 'rgb(0, 0, 0)',
    },
  },
]
