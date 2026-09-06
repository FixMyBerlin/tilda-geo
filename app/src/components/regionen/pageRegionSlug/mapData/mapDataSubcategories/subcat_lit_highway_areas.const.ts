import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import {
  litAreaCompletenessLayers,
  litAreaLayers,
  litAreaLegends,
  litAreaLitOnlyLegends,
  litMissingAreaDataLegend,
} from './manualStyles/lit'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'lit_highway_areas'
const source = 'atlas_highwayAreas'
const sourceLayer = 'highwayAreas'
export type SubcatLitHighwayAreasId = typeof subcatId
export type SubcatLitHighwayAreasStyleIds = 'default' | 'lit' | 'completeness'

export const subcat_lit_highway_areas: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Straßenflächen',
  ui: 'dropdown',
  sourceId: source,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Beleuchtung',
      layers: mapboxStyleLayers({
        layers: litAreaLayers(),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: litAreaLegends,
    },
    {
      id: 'lit',
      name: 'Beleuchtet',
      layers: mapboxStyleLayers({
        layers: litAreaLayers(),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
        additionalFilter: ['match', ['get', 'lit'], ['no'], false, true],
      }),
      legends: litAreaLitOnlyLegends,
    },
    {
      id: 'completeness',
      name: 'Vollständigkeit',
      layers: mapboxStyleLayers({
        layers: litAreaCompletenessLayers(),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: [...litAreaLegends, litMissingAreaDataLegend],
    },
  ],
}
