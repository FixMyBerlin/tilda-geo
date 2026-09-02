import type { FileMapDataSubcategory } from '../types'

const subcatId = 'poiPlusBusStops'
const source = 'atlas_publicTransport'
const sourceLayer = 'publicTransport'
export type SubcatPoiPlusBusStopsId = typeof subcatId
export type SubcatPoiPlusBusStopsStyleIds = 'default'

// Bus stops share the `publicTransport` table/tileset with `subcat_poi_plus_publicTransport`
// (`category: 'bus_stop'`), but get their own toggle since there are far more of them than
// the other ÖPNV categories combined.
export const subcat_poi_plus_busStops: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Bushaltestellen',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Standard',
      layers: [
        {
          id: 'bus-stops',
          type: 'symbol',
          source,
          'source-layer': sourceLayer,
          filter: ['==', ['get', 'category'], 'bus_stop'],
          layout: {
            'icon-allow-overlap': true,
            'icon-image': 'bus_stop',
            'icon-padding': 1,
            'icon-size': ['interpolate', ['linear'], ['zoom'], 14, 0.5, 18, 1],
          },
          paint: {
            'icon-opacity': 1,
          },
        },
      ],
      // legends: [{ id: 'bus_stop', name: 'Bushaltestelle', style: { type: 'symbol', color: '' } }],
    },
  ],
}
