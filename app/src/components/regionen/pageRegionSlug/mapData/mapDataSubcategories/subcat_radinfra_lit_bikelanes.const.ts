import type { FileMapDataSubcategory } from '../types'
import {
  litLineCompletenessLayers,
  litLineLegends,
  litMissingDataLegend,
  radinfraLitCompletenessOptions,
} from './manualStyles/lit'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'lit_bikelanes'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatRadinfraLitBikelanesId = typeof subcatId
export type SubcatRadinfraLitBikelanesStyleIds = 'default'

const completenessLegends = [
  ...litLineLegends,
  litMissingDataLegend(radinfraLitCompletenessOptions.missingColor, 'line', true),
]

export const subcat_radinfra_lit_bikelanes: FileMapDataSubcategory = {
  id: subcatId,
  name: 'RVA Beleuchtung',
  ui: 'checkbox',
  beforeId: 'atlas-app-beforeid-top',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'RVA Beleuchtung',
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
