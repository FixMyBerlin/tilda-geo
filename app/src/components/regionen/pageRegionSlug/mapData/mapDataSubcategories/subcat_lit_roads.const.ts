import type { FileMapDataSubcategory } from '../types'
import { litAbsentDataLegend, litLineLayers, litLineLegends } from './manualStyles/lit'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'lit'
const source = 'atlas_roads'
const sourceLayer = 'roads'
export type SubcatLitRoadsId = typeof subcatId
export type SubcatLitRoadsStyleIds = 'default'

export const subcat_lit_roads: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Straßen',
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
