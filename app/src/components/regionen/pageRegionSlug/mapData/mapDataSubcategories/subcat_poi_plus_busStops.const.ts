import type { FileMapDataSubcategory } from '../types'
import { customMapIcons } from './customMapIcons.const'

const subcatId = 'poiPlusBusStops'
const source = 'atlas_busStopsAndBikeSharing'
export type SubcatPoiPlusBusStopsId = typeof subcatId
export type SubcatPoiPlusBusStopsStyleIds = 'default'

// Bus stops share the `publicTransport` table with `subcat_poi_plus_publicTransport`
// (`category: 'bus_stop'`), but get their own toggle since there are far more of them than
// the other ÖPNV categories combined.
// Bike-sharing stations (`poiClassification`, `type` ending in `-bicycle_rental`) are bundled
// into the same toggle since both are common "last mile" access points.
// Both use custom pin icons (not part of the generated sprite, see `customMapIcons.const.ts`)
// so bike-sharing gets a badge as visible as the bus-stop one, instead of the bare, easy-to-miss
// `bicycle-share` glyph from the Maptiler sprite.
export const subcat_poi_plus_busStops: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Bushaltestelle + Bikesharing',
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
          'source-layer': 'publicTransport',
          filter: ['==', ['get', 'category'], 'bus_stop'],
          layout: {
            'icon-allow-overlap': true,
            'icon-anchor': 'bottom',
            'icon-image': customMapIcons.busStopPin.id,
            'icon-padding': 1,
            'icon-size': ['interpolate', ['linear'], ['zoom'], 14, 0.4, 18, 0.7],
          },
          paint: {
            'icon-opacity': 1,
          },
        },
        {
          id: 'bike-sharing',
          type: 'symbol',
          source,
          'source-layer': 'poiClassification',
          filter: [
            'in',
            ['get', 'type'],
            [
              'literal',
              ['amenity-bicycle_rental', 'tourism-bicycle_rental', 'leisure-bicycle_rental'],
            ],
          ],
          layout: {
            'icon-allow-overlap': true,
            'icon-anchor': 'bottom',
            'icon-image': customMapIcons.bikeSharePin.id,
            'icon-padding': 1,
            'icon-size': ['interpolate', ['linear'], ['zoom'], 14, 0.4, 18, 0.7],
          },
          paint: {
            'icon-opacity': 1,
          },
        },
      ],
      // legends: [
      //   { id: 'bus_stop', name: 'Bushaltestelle', style: { type: 'symbol', color: '' } },
      //   { id: 'bike_sharing', name: 'Bikesharing-Station', style: { type: 'symbol', color: '' } },
      // ],
    },
  ],
}
