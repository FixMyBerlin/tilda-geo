import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { layers_bikelanes_smooth_bad } from './layers/bikelanes_smooth_bad'
import { layers_bikelanes_smooth_default } from './layers/bikelanes_smooth_default'
import { withBikelaneVisualLineOffset } from './layers/utils/bikelaneLineOffset'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'
import { legendSurfaceBad, legendSurfaceDefault } from './subcat_surface_roads.const'

const subcatId = 'surfaceBikelanes'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatSurfaceBikelaneId = typeof subcatId
export type SubcatSurfaceBikelaneStyleIds = 'default' | 'bad'

export const subcat_surface_bikelane: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Radverkehrsanlagen',
  ui: 'dropdown',
  sourceId: 'atlas_bikelanes',
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Standard',
      layers: wrapSourceLayers({
        layers: withBikelaneVisualLineOffset(layers_bikelanes_smooth_default),
        source,
        sourceLayer,
      }),
      legends: legendSurfaceDefault,
    },
    {
      id: 'bad',
      name: 'Nur schlechte Oberflächen',
      layers: wrapSourceLayers({
        layers: withBikelaneVisualLineOffset(layers_bikelanes_smooth_bad),
        source,
        sourceLayer,
      }),
      legends: legendSurfaceBad,
    },
  ],
}
