import type { StyleLayer } from './utils/types'

export const layers_parkingTilda_street_pattern: StyleLayer[] = [
  {
    id: 'parallel pattern',
    type: 'line',
    filter: [
      'all',
      ['match', ['get', 'orientation'], ['parallel'], true, false],
      ['has', 'capacity'],
    ],
    paint: {
      'line-color': 'rgb(237, 237, 237)',
      'line-dasharray': [
        'match',
        ['get', 'staggered'],
        ['yes'],
        ['literal', [4, 2, 4, 2, 0, 12]],
        ['literal', [4, 2]],
      ],
      'line-opacity': 0.67,
      'line-width': ['interpolate', ['linear'], ['zoom'], 15, 0.5, 20, 4],
    },
  },
  {
    id: 'diagonal pattern',
    type: 'line',
    filter: [
      'all',
      ['match', ['get', 'orientation'], ['diagonal'], true, false],
      ['has', 'capacity'],
    ],
    minzoom: 16,
    paint: {
      'line-color': 'rgb(237, 237, 237)',
      'line-opacity': 0.67,
      'line-pattern': 'pattern-parking-diagonal',
      'line-width': ['interpolate', ['linear'], ['zoom'], 15, 2, 20, 16],
    },
  },
  {
    id: 'perpendicular pattern',
    type: 'line',
    filter: [
      'all',
      ['match', ['get', 'orientation'], ['perpendicular'], true, false],
      ['has', 'capacity'],
    ],
    minzoom: 16,
    paint: {
      'line-color': 'rgb(237, 237, 237)',
      'line-opacity': 0.67,
      'line-pattern': 'pattern-parking-perpendicular',
      'line-width': ['interpolate', ['linear'], ['zoom'], 15, 2, 20, 16],
    },
  },
]
