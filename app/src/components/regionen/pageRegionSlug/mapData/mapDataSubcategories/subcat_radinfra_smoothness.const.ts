import type { FileMapDataSubcategory, FileMapDataSubcategoryStyleLegend } from '../types'
import { layers_radinfra_smoothness } from './layers/radinfra_smoothness'
import { withBikelaneVisualLineOffset } from './layers/utils/bikelaneLineOffset'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'
import { legendSurfaceDefault } from './subcat_surface_roads.const'

const subcatId = 'bikelanes'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'

const bikelanesSmoothnessLegend: FileMapDataSubcategoryStyleLegend[] = [
  ...legendSurfaceDefault,
  {
    id: 'missing',
    name: 'Angaben fehlen',
    style: { type: 'line', color: '#fda5e4', dasharray: [3, 2], width: 2 },
  },
]

export const subcat_radinfra_smoothness: FileMapDataSubcategory = {
  id: subcatId,
  name: 'RVA Oberflächenqualität',
  ui: 'checkbox',
  beforeId: 'atlas-app-beforeid-top',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'RVA Oberflächenqualität', // field hidden
      layers: wrapSourceLayers({
        layers: withBikelaneVisualLineOffset(layers_radinfra_smoothness),
        source,
        sourceLayer,
      }),
      legends: bikelanesSmoothnessLegend,
    },
  ],
}
