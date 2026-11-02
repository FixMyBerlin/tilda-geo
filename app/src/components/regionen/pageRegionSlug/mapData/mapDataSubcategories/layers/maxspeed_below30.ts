import type { StyleLayer } from './utils/types'

export const layers_maxspeed_below30: StyleLayer[] = [
  {
    id: 'maxspeed-kleinergleich30',
    type: 'line',
    filter: ['<=', ['get', 'maxspeed'], 30],
    layout: {
      'line-cap': 'round',
    },
    paint: {
      'line-color': [
        'interpolate',
        ['linear'],
        ['get', 'maxspeed'],
        20,
        '#08aec4',
        30,
        '#2cb587',
        80,
        '#b80505',
      ],
      'line-opacity': 0.98,
      'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 15, 1],
    },
  },
  {
    id: 'hitarea-maxspeed30',
    type: 'line',
    filter: ['<=', ['get', 'maxspeed'], 30],
    layout: {
      'line-cap': 'round',
    },
    paint: {
      'line-color': 'rgb(216, 20, 255)',
      'line-opacity': 0,
      'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1, 14.1, 10, 22, 12],
    },
  },
]
