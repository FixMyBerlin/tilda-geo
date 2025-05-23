// DO NOT EDIT MANUALLY
// This file was automatically generated by `scripts/MapboxStyles/process.ts`

import { MapboxStyleLayer } from '../types'

export const mapboxStyleGroupLayers_atlas_places: MapboxStyleLayer[] = [
  {
    minzoom: 9,
    layout: {
      'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10, 22, 13],
      'text-font': ['Open Sans SemiBold', 'Arial Unicode MS Regular'],
      'icon-allow-overlap': true,
      'text-padding': 0,
      'text-offset': [0, 1],
      'icon-size': [
        'match',
        ['get', 'population'],
        ['6452'],
        3,
        ['8945'],
        4,
        ['10633', '11355'],
        5,
        ['17017'],
        8,
        ['38111'],
        19,
        1,
      ],
      'text-anchor': 'top',
      'text-field': [
        'step',
        ['zoom'],
        ['to-string', ['get', 'name']],
        10,
        ['to-string', ['concat', ['get', 'name'], ' \n ', ['get', 'population']]],
      ],
      'icon-padding': 0,
      'text-max-width': 20,
    },
    filter: ['match', ['get', 'place'], ['town', 'village', 'city'], true, false],
    type: 'symbol',
    id: 'places-names',
    paint: {
      'text-halo-color': 'hsla(0, 6%, 97%, 0.91)',
      'text-halo-width': 1,
      'text-color': '#594f4f',
      'text-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        9,
        ['match', ['get', 'place'], ['city', 'town'], 1, 0],
        10,
        ['match', ['get', 'place'], ['city', 'town'], 1, 0],
        10.5,
        ['match', ['get', 'place'], ['city', 'town', 'village'], 1, 0],
      ],
    },
  },
]
