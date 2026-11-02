import type { StyleLayer } from './utils/types'

export const layers_bikelanes_plus_signs: StyleLayer[] = [
  {
    id: 'trafficsigns',
    type: 'symbol',
    filter: [
      'match',
      ['get', 'traffic_sign'],
      [
        'DE:239,1022-10',
        'DE:239;237;258',
        'DE:240',
        'DE:240;258',
        'DE:240,1000-31',
        'DE:241',
        'DE:241-31',
        'DE:237',
        'DE:240;1000-31',
        'DE:244.1',
        'DE:245',
        'DE:325;357,1026-32',
      ],
      true,
      false,
    ],
    minzoom: 10,
    layout: {
      'icon-ignore-placement': true,
      // A dot marks the place, the sign is given as text.
      'icon-image': 'dot',
      'icon-padding': 50,
      'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 14, 1],
      'text-anchor': 'top',
      'text-field': ['to-string', ['get', 'traffic_sign']],
      'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
      'text-offset': [0, 0.8],
      'text-size': ['interpolate', ['linear'], ['zoom'], 12, 7, 22, 14],
    },
    paint: {
      'text-color': '#575757',
      'text-opacity': ['interpolate', ['linear'], ['zoom'], 13.5, 0, 13.6, 1],
    },
  },
]
