import type { FileMapDataSubcategory } from '../types'
import { layers_barriers__area } from './layers/barriers__area'
import { layers_barriers__line } from './layers/barriers__line'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

const subcatId = 'poiPlusBarriers'
const source = 'atlas_barriers'
export type SubcatPoiPlusBarriersId = typeof subcatId
export type SubcatPoiPlusBarriersStyleIds = 'default'

export const subcat_poi_plus_barriers: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Barrieren',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Standard',
      layers: [
        wrapSourceLayers({
          layers: layers_barriers__area,
          source,
          sourceLayer: 'barrierAreas',
        }),
        wrapSourceLayers({
          layers: layers_barriers__line,
          source,
          sourceLayer: 'barrierLines',
        }),
      ].flat(),
    },
  ],
}
