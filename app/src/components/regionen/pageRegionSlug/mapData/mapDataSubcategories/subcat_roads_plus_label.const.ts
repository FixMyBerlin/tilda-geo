import type { FileMapDataSubcategory } from '../types'
import { layers_roads_plus_label } from './layers/roads_plus_label'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

const subcatId = 'roads_plus_label'
const source = 'atlas_roads'
const sourceLayer = 'roads'
export type SubcatRoadsPlusLabelId = typeof subcatId
export type SubcatRoadsPlusLabelStyleIds = 'default'
export const subcat_roads_plus_label: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Label Hauptstraßen',
  ui: 'checkbox',
  sourceId: source,
  beforeId: 'atlas-app-beforeid-group1',
  styles: [
    {
      id: 'default',
      name: 'Label Hauptstraßen',
      layers: wrapSourceLayers({
        layers: layers_roads_plus_label,
        source,
        sourceLayer,
      }),
      legends: undefined,
    },
  ],
}
