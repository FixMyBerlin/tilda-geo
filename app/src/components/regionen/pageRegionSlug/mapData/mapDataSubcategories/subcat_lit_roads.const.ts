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

const subcatId = 'lit'
const source = 'atlas_roads'
const sourceLayer = 'roads'
export type SubcatLitRoadsId = typeof subcatId
export type SubcatLitRoadsStyleIds = 'default' | 'lit' | 'completeness'

export const subcat_lit_roads: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Straßen',
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
