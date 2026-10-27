import type { FileMapDataSubcategory } from '../types'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'
import { layers_ziele_plus_publictransport } from './layers/ziele_plus_publictransport'

const tpoicId = 'poiPlusPublicTransport'
const source = 'atlas_publicTransport'
const sourceLayer = 'publicTransport'
export type SubcatPoiPlusPublicTransportId = typeof tpoicId
export type SubcatPoiPlusPublicTransportStyleIds = 'default'

export const subcat_poi_plus_publicTransport: FileMapDataSubcategory = {
  id: tpoicId,
  name: 'ÖPNV-Haltepunkte und Fähranleger',
  ui: 'checkbox',
  sourceId: 'atlas_publicTransport',
  styles: [
    {
      id: 'default',
      name: 'Standard',
      layers: [
        ...wrapSourceLayers({
          layers: layers_ziele_plus_publictransport,
          source,
          sourceLayer,
        }),
        // `layers_ziele_plus_publictransport` has no icon for `bus_stop`.
        {
          id: 'bus-stops',
          type: 'symbol',
          source,
          'source-layer': sourceLayer,
          filter: ['==', ['get', 'category'], 'bus_stop'],
          layout: {
            'icon-allow-overlap': true,
            'icon-image': 'bus-stop',
            'icon-padding': 1,
            'icon-size': ['interpolate', ['linear'], ['zoom'], 14, 0.6, 18, 1],
          },
          paint: {
            'icon-opacity': 1,
          },
        },
      ],
      // legends: [
      //   { id: 'ferry_station', name: 'Fähranleger', style: { type: 'fill', color: '#6A6063' } },
      //   { id: 'subway_station', name: 'U-Bahn-Station', style: { type: 'fill', color: '' } },
      //   { id: 'light_rail_station', name: 'S-Bahn-Station', style: { type: 'fill', color: '' } },
      //   { id: 'tram_station', name: 'Tramstation', style: { type: 'fill', color: '' } },
      //   {
      //     id: 'railway_station',
      //     name: 'Bahnhof regional / überregional',
      //     style: { type: 'fill', color: '#4DA252' },
      //   },
      // ],
    },
  ],
}
