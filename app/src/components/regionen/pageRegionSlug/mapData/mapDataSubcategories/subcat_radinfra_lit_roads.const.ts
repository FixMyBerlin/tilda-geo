import type { FileMapDataSubcategory } from '../types'
import {
  litLineCompletenessLayers,
  litLineLegends,
  litMissingDataLegend,
  radinfraLitCompletenessOptions,
} from './manualStyles/lit'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'lit'
const source = 'atlas_roads'
const sourceLayer = 'roads'
export type SubcatRadinfraLitRoadsId = typeof subcatId
export type SubcatRadinfraLitRoadsStyleIds = 'default'

const completenessLegends = [
  ...litLineLegends,
  litMissingDataLegend(radinfraLitCompletenessOptions.missingColor, 'line', true),
]

export const subcat_radinfra_lit_roads: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Straßen Beleuchtung',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Straßen Beleuchtung',
      layers: mapboxStyleLayers({
        layers: litLineCompletenessLayers(radinfraLitCompletenessOptions),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: completenessLegends,
    },
  ],
}
