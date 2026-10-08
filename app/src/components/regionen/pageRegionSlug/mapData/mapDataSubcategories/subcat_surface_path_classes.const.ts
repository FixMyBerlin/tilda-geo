import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { surfaceLineBadLayers } from './manualStyles/surface'
import { mapboxStyleGroupLayers_atlas_roads_smooth_all } from './mapboxStyles/groups/atlas_roads_smooth_all'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'
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
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_roads_smooth_all,
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: legendSurfaceDefault,
    },
    {
      id: 'bad',
      name: 'Nur schlechte Oberflächen',
      layers: mapboxStyleLayers({
        layers: surfaceLineBadLayers(),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: legendSurfaceBad,
    },
  ],
}
