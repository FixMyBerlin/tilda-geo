import type { FileMapDataSubcategory } from '../types'
import { layers_parkingTilda_street_no } from './layers/parkingTilda_street_no'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

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
      layers: wrapSourceLayers({
        layers: layers_parkingTilda_street_no,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'no_parking',
          name: 'Parkverbot',
          style: { type: 'line', color: 'rgb(249, 115, 22)', dasharray: [1, 0.75] },
        },
        {
          id: 'no_stopping',
          name: 'Halteverbot',
          style: { type: 'line', color: 'rgb(235, 0, 0)', dasharray: [1, 0.75] },
        },
      ],
    },
  ],
}
