import type { FileMapDataSubcategory } from '../types'
import { litAbsentAreaDataLegend, litAreaLayers, litAreaLegends } from './manualStyles/lit'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'lit_highway_areas'
const source = 'tilda_highwayAreas'
const sourceLayer = 'highwayAreas'
export type SubcatLitHighwayAreasId = typeof subcatId
export type SubcatLitHighwayAreasStyleIds = 'default'

export const subcat_lit_highway_areas: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Straßenflächen',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Beleuchtung',
      layers: mapboxStyleLayers({
        layers: litAreaLayers(),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: [...litAreaLegends, litAbsentAreaDataLegend],
    },
  ],
}
