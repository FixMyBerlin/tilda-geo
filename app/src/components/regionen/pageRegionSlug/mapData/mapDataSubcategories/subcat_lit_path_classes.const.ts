import type { FileMapDataSubcategory } from '../types'
import { litAbsentDataLegend, litLineLayers, litLineLegends } from './manualStyles/lit'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'lit_path_classes'
const source = 'atlas_roadsPathClasses'
const sourceLayer = 'roadsPathClasses'
export type SubcatLitPathClassesId = typeof subcatId
export type SubcatLitPathClassesStyleIds = 'default'

export const subcat_lit_path_classes: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Fußweg, Pfad, Sonderweg, u.a.',
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
