import { FileMapDataSubcategory } from '../types'
import { MapboxStyleLayersProps } from './mapboxStyles/mapboxStyleLayers'
import { createSharedStreetStyles } from './subcat_parkingTilda_street_public.const'

const subcatId = 'parkingTildaPrivate'
const source = 'tilda_parkings'
export type SubcatParkingTildaPrivateId = typeof subcatId
export type SubcatParkingTildaPrivateStyleIds = 'default' | 'surface' | 'kind'

const privateFilter: MapboxStyleLayersProps['additionalFilter'] = [
  'match',
  ['get', 'operator_type'],
  ['private', 'assumed_private'],
  true,
  false,
]
export const subcat_parkingTilda_street_private: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Privates Straßenparken',
  ui: 'dropdown',
  sourceId: source,
  beforeId: undefined,
  styles: createSharedStreetStyles(privateFilter),
}
