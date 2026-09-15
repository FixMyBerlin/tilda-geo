import type { FileMapDataSubcategory } from '../types'
import type { MapboxStyleLayersProps } from './mapboxStyles/mapboxStyleLayers'
import {
  attachParkingTildaEdges,
  createSharedStreetStyles,
  parkingTildaPrivateDefaultLegend,
} from './subcat_parkingTilda_street_public.const'

const subcatId = 'parkingTildaPrivate'
const source = 'tilda_parkings'
export type SubcatParkingTildaPrivateId = typeof subcatId
export type SubcatParkingTildaPrivateStyleIds = 'default' | 'surface' | 'kind'

const privateFilter: MapboxStyleLayersProps['additionalFilter'] = [
  'match',
  ['get', 'operator_type'],
  ['private'],
  true,
  false,
]
export const subcat_parkingTilda_street_private: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Privates Straßenparken',
  ui: 'dropdown',
  sourceId: source,
  beforeId: undefined,
  styles: attachParkingTildaEdges(
    createSharedStreetStyles(privateFilter),
    'private',
    parkingTildaPrivateDefaultLegend,
  ),
}
