import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_atlas_barriers__area } from './mapboxStyles/groups/atlas_barriers__area'
import { mapboxStyleGroupLayers_atlas_barriers__line } from './mapboxStyles/groups/atlas_barriers__line'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

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
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_atlas_barriers__area,
          source,
          sourceLayer: 'barrierAreas',
        }),
        mapboxStyleLayers({
          layers: mapboxStyleGroupLayers_atlas_barriers__line,
          source,
          sourceLayer: 'barrierLines',
        }),
      ].flat(),
    },
  ],
}
