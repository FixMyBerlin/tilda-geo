import type { FileMapDataSubcategory } from '../types'
import {
  litLineCompletenessLayersRadinfra,
  litLineLegends,
  litMissingDataLegendRadinfra,
} from './layers/lit'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

const subcatId = 'lit_bikelanes'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatRadinfraLitBikelanesId = typeof subcatId
export type SubcatRadinfraLitBikelanesStyleIds = 'default'

const completenessLegends = [...litLineLegends, litMissingDataLegendRadinfra]

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
      layers: wrapSourceLayers({
        layers: litLineCompletenessLayersRadinfra(),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: completenessLegends,
    },
  ],
}
