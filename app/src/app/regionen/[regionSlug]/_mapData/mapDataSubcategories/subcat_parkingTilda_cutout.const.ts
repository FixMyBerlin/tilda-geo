import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_tilda_parkings_cutouts } from './mapboxStyles/groups/tilda_parkings_cutouts'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTildaCutouts'
const source = 'tilda_parkings_cutouts'
const sourceLayer = 'parkings_cutouts'
export type SubcatParkingTildaCutoutsId = typeof subcatId
export type SubcatParkingTildaCutoutsStyleIds = 'default'

export const subcat_parkingTilda_cutout: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Parkraum Stanzungen',
  ui: 'checkbox',
  sourceId: source,
  beforeId: undefined,
  styles: [
    {
      id: 'default',
      name: 'Standard',
      desc: null,
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_tilda_parkings_cutouts,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'ring-bus',
          name: 'Haltestellen',
          desc: ['bus_stop', 'bus_stop_conditional'],
          style: { type: 'line', color: 'hsla(48, 96%, 53%, 0.7)', width: 5 },
        },
        {
          id: 'ring-mobility',
          name: 'Mobilitätshubs & Verleih',
          desc: [
            'mobility_hub',
            'bicycle_rental',
            'motorcycle_parking',
            'small_electric_vehicle_parking',
            'bicycle_parking',
            'parklet',
          ],
          style: { type: 'line', color: 'hsla(0, 92%, 34%, 0.59)', width: 5 },
        },
        {
          id: 'ring-street-furniture',
          name: 'Straßenmöbel & Bäume',
          desc: [
            'street_lamp',
            'tree',
            'street_cabinet',
            'advertising',
            'bollard',
            'recycling',
            'vending_parking_tickets',
          ],
          style: { type: 'line', color: 'hsla(242, 39%, 31%, 0.88)', width: 5 },
        },
        {
          id: 'ring-crossings',
          name: 'Querungen',
          desc: [
            'crossing_zebra',
            'crossing_marked',
            'crossing_buffer_marking',
            'traffic_calming_choker',
            'crossing_traffic_signals',
            'crossing_kerb_extension',
          ],
          style: { type: 'line', color: 'hsla(133, 65%, 35%, 0.73)', width: 5 },
        },
        {
          id: 'ring-access',
          name: 'Einfahrten & Rampen',
          desc: ['driveway', 'loading_ramp'],
          style: { type: 'line', color: 'hsla(270, 29%, 38%, 0.61)', width: 5 },
        },
        {
          id: 'ring-markings',
          name: 'Markierungen & Barrieren',
          desc: [
            'road_marking_restricted_area',
            'turning_circle',
            'kerb_lowered',
            'parking_kerb',
            'barrier',
            'turning_loop',
          ],
          style: { type: 'line', color: 'hsla(206, 62%, 31%, 0.6)', width: 5 },
        },
      ],
    },
  ],
}
