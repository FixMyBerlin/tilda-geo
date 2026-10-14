import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import {
  surfaceAreaLayers,
  surfaceAreaLegendsBad,
  surfaceAreaLegendsDefault,
} from './layers/surface'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

const subcatId = 'surfaceHighwayAreas'
const source = 'tilda_highwayAreas'
const sourceLayer = 'highwayAreas'
export type SubcatSurfaceHighwayAreasId = typeof subcatId
export type SubcatSurfaceHighwayAreasStyleIds = 'default' | 'bad'

export const subcat_surface_highway_areas: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Straßenflächen',
  ui: 'dropdown',
  // Above landuse/aeroway (the default fill slot is under `landuse`), below road lines.
  beforeId: 'atlas-app-beforeid-below-road',
  sourceId: source,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Standard',
      layers: wrapSourceLayers({
        layers: surfaceAreaLayers({ badOnly: false }),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: surfaceAreaLegendsDefault,
    },
    {
      id: 'bad',
      name: 'Nur schlechte Oberflächen',
      layers: wrapSourceLayers({
        layers: surfaceAreaLayers({ badOnly: true }),
        source,
        sourceLayer,
        idPrefix: sourceLayer,
      }),
      legends: surfaceAreaLegendsBad,
    },
  ],
}
