import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { layers_parkingLars_boundaries } from './layers/parkingLars_boundaries'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

const subcatId = 'parkingBoundaries'
const source = 'lars_parking_stats'
const sourceLayer = 'processing.boundaries_stats'
export type SubcatParkingLarsBoundariesId = typeof subcatId
export type SubcatParkingLarsBoundariesStyleIds =
  | 'boundaries-admin-level-4'
  | 'boundaries-admin-level-9'
  | 'default'

export const subcat_parkingLarsBoundaries: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Grenzen',
  ui: 'dropdown',
  sourceId: source,
  beforeId: undefined,
  styles: [
    defaultStyleHidden,
    {
      id: 'boundaries-admin-level-4',
      name: 'Stadt',
      layers: wrapSourceLayers({
        layers: layers_parkingLars_boundaries,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['4'], true, false],
      }),
    },
    {
      id: 'boundaries-admin-level-9',
      name: 'Bezirke',
      layers: wrapSourceLayers({
        layers: layers_parkingLars_boundaries,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['9'], true, false],
      }),
    },
    {
      id: 'default', // 'boundaries-admin-level-10',
      name: 'Stadtteile',
      layers: wrapSourceLayers({
        layers: layers_parkingLars_boundaries,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'admin_level'], ['10'], true, false],
      }),
    },
  ],
}
