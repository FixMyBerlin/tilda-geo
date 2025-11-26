import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_atlas_bikelanes_plus_widths } from './mapboxStyles/groups/atlas_bikelanes_plus_widths'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'bikelanes_plus_width'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatBikelanesPlusWidthTextId = typeof subcatId
export type SubcatBikelanesPlusWidthTextStyleIds = 'default'

export const subcat_bikelanes_plus_width_text: FileMapDataSubcategory = {
  id: subcatId,
  name: 'RVA Breite (Text)',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Breite (Text)',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_bikelanes_plus_widths,
        source,
        sourceLayer,
      }),
      // legends: [...defaultLegend],
    },
  ],
}
