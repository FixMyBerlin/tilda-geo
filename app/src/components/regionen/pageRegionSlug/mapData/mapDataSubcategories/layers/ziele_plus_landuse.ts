import type { StyleLayer } from './utils/types'

export const layers_ziele_plus_landuse: StyleLayer[] = [
  {
    id: 'tarmac-landuse-test-datensatz-0r36t3',
    type: 'fill',
    filter: ['has', 'landuse'],
    paint: {
      'fill-color': [
        'case',
        ['match', ['get', 'landuse'], ['residential'], true, false],
        '#fdd4c4',
        ['match', ['get', 'landuse'], ['residential'], false, true],
        '#cec0fb',
        'rgba(255, 255, 255, 0.57)',
      ],
    },
  },
]
