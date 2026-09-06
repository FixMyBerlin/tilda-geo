import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import {
  litLineCompletenessLayers,
  litLineLayers,
  litLineLegends,
  litLineLitOnlyLegends,
  litMissingDataLegend,
} from './manualStyles/lit'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'lit_bikelanes'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatLitBikelanesId = typeof subcatId
export type SubcatLitBikelanesStyleIds = 'default' | 'lit' | 'completeness'

export const subcat_lit_bikelanes: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Radverkehrsanlagen',
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
        layers: litLineCompletenessLayers(),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: [...litLineLegends, litMissingDataLegend],
    },
  ],
}
