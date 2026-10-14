import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import {
  bicycleParkingAreaLayers,
  bicycleParkingLegends,
  bicycleParkingPointLayers,
} from './layers/bicycleParking'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

const subcatId = 'bicycleParking'
const source = 'atlas_bicycleParking'
export type SubcatBicycleParkingId = typeof subcatId
export type SubcatBicycleParkingStyleIds = 'default' | 'witharea'

export const subcat_bicycleParking: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Fahrrad- & Mikromobilitätsparken',
  ui: 'dropdown',
  sourceId: source,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Standard',
      layers: [
        ...wrapSourceLayers({
          layers: bicycleParkingAreaLayers(),
          source,
          sourceLayer: 'bicycleParking_areas',
          interactive: false,
          idPrefix: 'bicycleParking_areas',
        }),
        ...wrapSourceLayers({
          layers: bicycleParkingPointLayers(),
          source,
          sourceLayer: 'bicycleParking_points',
          idPrefix: 'bicycleParking_points',
        }),
      ],
      legends: bicycleParkingLegends,
    },
  ],
}
