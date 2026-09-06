import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import {
  litColors,
  litLineCompletenessLayers,
  litLineLayers,
  litLineLegends,
  litLineLitOnlyLegends,
  litMissingDataLegend,
} from './manualStyles/lit'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'lit_path_classes'
const source = 'atlas_roadsPathClasses'
const sourceLayer = 'roadsPathClasses'
export type SubcatLitPathClassesId = typeof subcatId
export type SubcatLitPathClassesStyleIds = 'default' | 'lit' | 'completeness'

export const subcat_lit_path_classes: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Fußweg, Pfad, Sonderweg, u.a.',
  ui: 'dropdown',
  sourceId: source,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Beleuchtung',
      layers: mapboxStyleLayers({
        layers: litLineLayers(),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: litLineLegends,
    },
    {
      id: 'lit',
      name: 'Beleuchtet',
      layers: mapboxStyleLayers({
        layers: litLineLayers(),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
        additionalFilter: ['match', ['get', 'lit'], ['no'], false, true],
      }),
      legends: litLineLitOnlyLegends,
    },
    {
      id: 'completeness',
      name: 'Vollständigkeit',
      layers: mapboxStyleLayers({
        layers: litLineCompletenessLayers({ missingColor: litColors.missingGeneral }),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: [...litLineLegends, litMissingDataLegend(litColors.missingGeneral, 'line')],
    },
  ],
}
