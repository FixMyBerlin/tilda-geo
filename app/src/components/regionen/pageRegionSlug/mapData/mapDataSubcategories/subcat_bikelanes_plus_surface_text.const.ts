import type { FileMapDataSubcategory } from '../types'
import { layers_bikelanes_plus_surfaces } from './layers/bikelanes_plus_surfaces'
import { withBikelaneVisualLineOffset } from './layers/utils/bikelaneLineOffset'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

const subcatId = 'bikelanes_plus_surface_smoothness'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatBikelanesPlusSurfaceId = typeof subcatId
export type SubcatBikelanesPlusSurfaceStyleIds = 'default'

export const subcat_bikelanes_plus_surface_text: FileMapDataSubcategory = {
  id: subcatId,
  name: 'RVA Oberfläche (Text)',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Oberfläche (Text)',
      layers: wrapSourceLayers({
        layers: withBikelaneVisualLineOffset(layers_bikelanes_plus_surfaces),
        source,
        sourceLayer,
      }),
      // legends: [...defaultLegend],
    },
  ],
}
