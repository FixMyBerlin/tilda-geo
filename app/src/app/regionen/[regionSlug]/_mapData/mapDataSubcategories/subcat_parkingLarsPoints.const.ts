import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_parking_calculator } from './mapboxStyles/groups/parking_calculator'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingPoints'
export type SubcatParkingLarsPointsId = typeof subcatId
export type SubcatParkingLarsPointsStyleIds = 'default'

export const subcat_parkingLarsPoints: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Parkplätze zählen',
  ui: 'checkbox',
  sourceId: 'lars_parking_points',
  beforeId: undefined,
  styles: [
    {
      id: 'default',
      name: 'Standard',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_parking_calculator,
        source: 'lars_parking_points',
        sourceLayer: 'processing.parking_spaces',
      }),
    },
  ],
}
