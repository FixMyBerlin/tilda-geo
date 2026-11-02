import type { StyleLayer } from './utils/types'

export const layers_parkingLars_debug_kerb: StyleLayer[] = [
  {
    id: 'buffer-kerb-intersection-area',
    type: 'fill',
    minzoom: 15,
    paint: {
      'fill-antialias': false,
      'fill-color': 'rgba(233, 89, 12, 0.7)',
    },
  },
  {
    id: 'buffer-kerb-intersection-icon',
    type: 'symbol',
    minzoom: 16.5,
    layout: {
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-image': 'cross',
      'icon-size': ['interpolate', ['linear'], ['zoom'], 0, 0, 15, 0, 20, 1],
    },
    paint: {},
  },
  {
    id: 'buffer-kerb-intersection-border',
    type: 'line',
    minzoom: 16.5,
    paint: {
      'line-color': 'rgb(0, 0, 0)',
      'line-dasharray': [2, 2],
      'line-opacity': 0.7,
    },
  },
]
