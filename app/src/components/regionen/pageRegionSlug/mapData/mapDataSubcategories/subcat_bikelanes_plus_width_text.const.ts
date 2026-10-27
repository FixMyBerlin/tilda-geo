import type { FileMapDataSubcategory } from '../types'
import { layers_bikelanes_plus_widths } from './layers/bikelanes_plus_widths'
import { withBikelaneVisualLineOffset } from './layers/utils/bikelaneLineOffset'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

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
      layers: wrapSourceLayers({
        layers: withBikelaneVisualLineOffset(layers_bikelanes_plus_widths),
        source,
        sourceLayer,
      }),
      // legends: [...defaultLegend],
    },
  ],
}
