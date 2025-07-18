// DO NOT EDIT MANUALLY
// This file was automatically generated by `scripts/MapboxStyles/process.ts`

import { MapboxStyleLayer } from '../types'

export const mapboxStyleGroupLayers_atlas_roads_plus_oneway: MapboxStyleLayer[] = [
  {
    minzoom: 11,
    filter: [
      'all',
      ['has', 'oneway'],
      ['match', ['get', 'oneway_bicycle'], ['no', 'yes'], false, true],
      [
        'match',
        ['get', 'road'],
        [
          'motorway',
          'motorway_link',
          'primary',
          'primary_link',
          'trunk_link',
          'trunk',
          'secondary_link',
          'secondary',
        ],
        false,
        true,
      ],
    ],
    type: 'line',
    id: 'oneway-road',
    paint: {
      'line-color': [
        'match',
        ['get', 'oneway'],
        ['yes_dual_carriageway'],
        '#f1e9f2',
        ['yes'],
        '#fad329',
        '#000000',
      ],
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 22, 16],
    },
  },
  {
    minzoom: 11,
    filter: ['has', 'oneway_bicycle'],
    type: 'line',
    id: 'oneway-road-bicycle',
    paint: {
      'line-color': [
        'match',
        ['get', 'oneway_bicycle'],
        ['no'],
        '#54f8b6',
        ['yes'],
        '#fad329',
        'rgba(0, 0, 0, 0.22)',
      ],
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 22, 16],
    },
  },
  {
    minzoom: 13,
    layout: {
      'line-cap': 'square',
      'line-miter-limit': 0,
    },
    filter: [
      'all',
      ['match', ['get', 'oneway_bicycle'], ['no'], true, false],
      [
        'match',
        ['get', 'road'],
        [
          'motorway',
          'motorway_link',
          'primary',
          'primary_link',
          'trunk_link',
          'trunk',
          'secondary_link',
          'secondary',
        ],
        false,
        true,
      ],
    ],
    type: 'line',
    id: 'roads-onewaybikeyes-pattern plus',
    paint: {
      'line-pattern': 'arrow-blue-dots-gap(1)',
      'line-width': ['interpolate', ['linear'], ['zoom'], 13, 3, 15, 5, 22, 10],
      'line-opacity': 0.8,
    },
  },
  {
    minzoom: 13,
    layout: {
      'line-cap': 'square',
    },
    filter: [
      'all',
      ['has', 'oneway'],
      ['match', ['get', 'oneway'], ['yes', 'implicit_yes'], true, false],
      [
        'match',
        ['get', 'road'],
        [
          'motorway',
          'motorway_link',
          'primary',
          'primary_link',
          'trunk_link',
          'trunk',
          'secondary_link',
          'secondary',
        ],
        false,
        true,
      ],
    ],
    type: 'line',
    id: 'roads-oneway-pattern plus',
    paint: {
      'line-pattern': 'arrow-grey-gap(1)',
      'line-width': ['interpolate', ['linear'], ['zoom'], 13, 3, 15, 5, 22, 10],
      'line-opacity': 0.7,
    },
  },
]
