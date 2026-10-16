import type { StyleLayer } from './utils/types'

export const layers_bikelanes_plus_widths: StyleLayer[] = [
  {
    id: 'widths',
    type: 'symbol',
    minzoom: 12,
    layout: {
      'symbol-placement': 'line-center',
      'text-field': ['to-string', ['get', 'width']],
      'text-font': ['Open Sans SemiBold', 'Arial Unicode MS Regular'],
      'text-padding': 4,
      'text-size': ['interpolate', ['linear'], ['zoom'], 12, 8, 22, 18],
    },
    paint: {
      'text-color': ['interpolate', ['linear'], ['zoom'], 12, '#8c8c8c', 16, '#747272'],
    },
  },
]
