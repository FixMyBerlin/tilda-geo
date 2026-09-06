import type { FileMapDataSubcategory } from '../types'
import {
  litLineCompletenessLayersRadinfra,
  litLineLegends,
  litMissingDataLegendRadinfra,
} from './manualStyles/lit'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'lit_path_classes'
const source = 'atlas_roadsPathClasses'
const sourceLayer = 'roadsPathClasses'
export type SubcatRadinfraLitPathClassesId = typeof subcatId
export type SubcatRadinfraLitPathClassesStyleIds = 'default'

const completenessLegends = [...litLineLegends, litMissingDataLegendRadinfra]

export const subcat_radinfra_lit_path_classes: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Wege Beleuchtung',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Wege Beleuchtung',
      layers: mapboxStyleLayers({
        layers: litLineCompletenessLayersRadinfra(),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: completenessLegends,
    },
  ],
}
