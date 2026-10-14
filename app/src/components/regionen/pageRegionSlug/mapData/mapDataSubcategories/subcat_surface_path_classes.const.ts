import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { layers_roads_smooth_all } from './layers/roads_smooth_all'
import { surfaceLineBadLayers } from './layers/surface'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'
import { legendSurfaceBad, legendSurfaceDefault } from './subcat_surface_roads.const'

const subcatId = 'surfacePathClasses'
const source = 'atlas_roadsPathClasses'
const sourceLayer = 'roadsPathClasses'
export type SubcatSurfacePathClassesId = typeof subcatId
export type SubcatSurfacePathClassesStyleIds = 'default' | 'bad'

export const subcat_surface_path_classes: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Fußweg, Pfad, Sonderweg, u.a.',
  ui: 'dropdown',
  sourceId: source,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Standard',
      layers: wrapSourceLayers({
        layers: layers_roads_smooth_all,
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: legendSurfaceDefault,
    },
    {
      id: 'bad',
      name: 'Nur schlechte Oberflächen',
      layers: wrapSourceLayers({
        layers: surfaceLineBadLayers(),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: legendSurfaceBad,
    },
  ],
}
