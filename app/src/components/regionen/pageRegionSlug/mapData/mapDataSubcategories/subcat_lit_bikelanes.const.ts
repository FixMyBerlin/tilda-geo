import type { FileMapDataSubcategory } from '../types'
import { litAbsentDataLegend, litLineLayers, litLineLegends } from './manualStyles/lit'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'lit_bikelanes'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatLitBikelanesId = typeof subcatId
export type SubcatLitBikelanesStyleIds = 'default'

export const subcat_lit_bikelanes: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Radverkehrsanlagen',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Beleuchtung',
      layers: mapboxStyleLayers({
        layers: litLineLayers(),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: [...litLineLegends, litAbsentDataLegend],
    },
  ],
}
