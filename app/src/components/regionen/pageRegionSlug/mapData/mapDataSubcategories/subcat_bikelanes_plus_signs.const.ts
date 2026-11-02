import type { FileMapDataSubcategory } from '../types'
import { layers_bikelanes_plus_signs } from './layers/bikelanes_plus_signs'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

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
      layers: wrapSourceLayers({
        layers: layers_bikelanes_plus_signs,
        source,
        sourceLayer,
      }),
      // legends: [...defaultLegend],
    },
  ],
}
