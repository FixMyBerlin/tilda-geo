import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_tilda_parkings_missing } from './mapboxStyles/groups/tilda_parkings_missing'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTildaNo'
const source = 'tilda_parkings_no'
const sourceLayer = 'parkings_no'
export type SubcatParkingTildaNoId = typeof subcatId
export type SubcatParkingTildaNoStyleIds = 'default'

export const subcat_parkingTildaNo: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Parkverbote',
  ui: 'dropdown',
  sourceId: source,
  beforeId: undefined,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Standard',
      desc: null,
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_tilda_parkings_missing,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'no_parking',
          name: 'Parkverbot',
          style: { type: 'fill', color: 'rgb(102, 21, 168)' },
        },
      ],
    },
  ],
}
