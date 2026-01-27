import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_park_street_no } from './mapboxStyles/groups/park_street_no'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTildaNo'
const source = 'tilda_parkings_no'
const sourceLayer = 'parkings_no'
export type SubcatParkingTildaNoId = typeof subcatId
export type SubcatParkingTildaNoStyleIds = 'default'

export const subcat_parkingTilda_street_no: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Parkverbote',
  ui: 'checkbox',
  sourceId: source,
  beforeId: undefined,
  styles: [
    {
      id: 'default',
      name: 'Standard',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_park_street_no,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'no_parking',
          name: 'Parkverbot',
          style: { type: 'line', color: 'rgb(255, 168, 8)', dasharray: [1, 0.5] },
        },
        {
          id: 'no_stopping',
          name: 'Halteverbot',
          style: { type: 'line', color: 'rgb(255, 0, 0)', dasharray: [1, 0.5] },
        },
      ],
    },
  ],
}
