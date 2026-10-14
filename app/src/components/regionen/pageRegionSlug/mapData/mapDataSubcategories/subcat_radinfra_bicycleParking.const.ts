import type { FileMapDataSubcategory } from '../types'
import {
  bicycleParkingCapacityAreaLayers,
  bicycleParkingCapacityLegends,
  bicycleParkingCapacityPointLayers,
} from './layers/bicycleParking'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

const subcatId = 'radinfraBicycleParking'
const source = 'atlas_bicycleParking'
export type SubcatRadinfraBicycleParkingId = typeof subcatId
export type SubcatRadinfraBicycleParkingStyleIds = 'default'

export const subcat_radinfra_bicycleParking: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Anzahl Stellplätze',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Standard',
      layers: [
        ...wrapSourceLayers({
          layers: bicycleParkingCapacityAreaLayers(),
          source,
          sourceLayer: 'bicycleParking_areas',
          interactive: false,
          idPrefix: 'radinfra_bicycleParking_areas',
        }),
        ...wrapSourceLayers({
          layers: bicycleParkingCapacityPointLayers(),
          source,
          sourceLayer: 'bicycleParking_points',
          idPrefix: 'radinfra_bicycleParking_points',
        }),
      ],
      legends: bicycleParkingCapacityLegends,
    },
  ],
}
