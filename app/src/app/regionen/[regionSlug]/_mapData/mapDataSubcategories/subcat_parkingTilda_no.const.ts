import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_tilda_parkings_no } from './mapboxStyles/groups/tilda_parkings_no'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTildaNo'
const source = 'tilda_parkings_no'
const sourceLayer = 'parkings_no'
export type SubcatParkingTildaNoId = typeof subcatId
export type SubcatParkingTildaNoStyleIds = 'default'

export const subcat_parkingTilda_no: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Parkverbote (TODO)',
  ui: 'checkbox',
  sourceId: source,
  beforeId: undefined,
  styles: [
    {
      id: 'default',
      name: 'Standard',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_tilda_parkings_no,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'no_parking',
          name: 'Parkverbot',
          style: { type: 'fill', color: 'rgb(151, 17, 17)' },
        },
        {
          id: 'small',
          name: 'Zu wenig Platz',
          style: { type: 'fill', color: 'rgb(107, 41, 41)' },
        },
      ],
    },
  ],
}
