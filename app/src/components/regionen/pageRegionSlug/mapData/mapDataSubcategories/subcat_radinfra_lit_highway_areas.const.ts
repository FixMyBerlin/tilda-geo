import type { FileMapDataSubcategory } from '../types'
import {
  litAreaCompletenessLayersRadinfra,
  litAreaLegends,
  litMissingAreaDataLegendRadinfra,
} from './manualStyles/lit'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'lit_highway_areas'
const source = 'atlas_highwayAreas'
const sourceLayer = 'highwayAreas'
export type SubcatRadinfraLitHighwayAreasId = typeof subcatId
export type SubcatRadinfraLitHighwayAreasStyleIds = 'default'

const completenessLegends = [...litAreaLegends, litMissingAreaDataLegendRadinfra]

export const subcat_radinfra_lit_highway_areas: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Flächen Beleuchtung',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Flächen Beleuchtung',
      layers: mapboxStyleLayers({
        layers: litAreaCompletenessLayersRadinfra(),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: completenessLegends,
    },
  ],
}
