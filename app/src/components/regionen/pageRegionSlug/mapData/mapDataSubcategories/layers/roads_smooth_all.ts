import type { StyleLayer } from './utils/types'

export const layers_roads_smooth_all: StyleLayer[] = [
  {
    id: 'smoothness-roads-all',
    type: 'line',
    filter: ['has', 'smoothness'],
    paint: {
      'line-color': [
        'match',
        ['get', 'smoothness'],
        ['bad'],
        '#f90606',
        ['very_bad'],
        '#d8035c',
        ['intermediate'],
        '#faa00f',
        ['good'],
        '#b5ea2e',
        ['excellent'],
        '#37f644',
        '#000000',
      ],
      'line-opacity': ['interpolate', ['linear'], ['zoom'], 9.9, 0, 10, 0.1, 10.3, 0.9],
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 3, 16, 5],
    },
  },
]
