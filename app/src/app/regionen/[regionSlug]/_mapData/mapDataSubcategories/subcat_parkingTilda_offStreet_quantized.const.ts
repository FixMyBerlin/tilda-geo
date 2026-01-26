import { FileMapDataSubcategory } from '../types'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTildaQuantizedOffStreet'
const source = 'tilda_parkings_off_street_quantized'
const sourceLayer = 'parkings_off_street_quantized'
export type SubcatParkingTildaQuantizedOffStreetId = typeof subcatId
export type SubcatParkingTildaQuantizedOffStreetStyleIds = 'default'

export const subcat_parkingTilda_offStreet_quantized: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Summieren: Parken abseits des Straßenraumes (TODO)',
  ui: 'checkbox',
  sourceId: source,
  beforeId: undefined,
  styles: [
    {
      id: 'default',
      name: 'Standard',
      legends: [
        {
          id: 'calc',
          name: 'Parkstand (berechnet)',
          style: {
            type: 'circle',
            color: '#6d28d9',
          },
        },
      ],
      layers: mapboxStyleLayers({
        layers: [
          {
            id: 'parking-points',
            type: 'circle',
            paint: {
              'circle-color': '#6d28d9',
              'circle-stroke-color': '#fdf4ff',
              'circle-stroke-opacity': 0.9,
              'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 16, 0, 20, 2],
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 0, 17, 3],
            },
            filter: ['==', '$type', 'Point'],
          },
        ],
        source,
        sourceLayer,
      }),
    },
  ],
}
