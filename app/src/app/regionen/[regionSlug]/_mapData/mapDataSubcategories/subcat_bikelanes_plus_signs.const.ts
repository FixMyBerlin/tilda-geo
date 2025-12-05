import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_atlas_bikelanes_plus_signs } from './mapboxStyles/groups/atlas_bikelanes_plus_signs'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'bikelanes_plus_signs'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatBikelanesPlusSignsId = typeof subcatId
export type SubcatBikelanesPlusSignsStyleIds = 'default'

export const subcat_bikelanes_plus_signs: FileMapDataSubcategory = {
  id: subcatId,
  name: 'RVA Verkehrszeichen',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Verkehrszeichen',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_bikelanes_plus_signs,
        source,
        sourceLayer,
      }),
      // legends: [...defaultLegend],
    },
  ],
}
