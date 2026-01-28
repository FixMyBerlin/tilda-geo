import { FileMapDataSubcategory } from '../types'
import { MapboxStyleLayersProps } from './mapboxStyles/mapboxStyleLayers'
import { createSharedOffStreetStyles } from './subcat_parkingTilda_offStreet_public.const'

const subcatId = 'parkingTildaOffStreetPrivate'
const source = 'tilda_parkings_off_street'
export type SubcatParkingTildaOffStreetPrivateId = typeof subcatId
export type SubcatParkingTildaOffStreetPrivateStyleIds = 'default' | 'surface' | 'kind'

const privateFilter: MapboxStyleLayersProps['additionalFilter'] = [
  'match',
  ['get', 'operator_type'],
  ['private', 'assumed_private'],
  true,
  false,
]

export const subcat_parkingTilda_offStreet_private: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Privates Parken abseits des Straßenraum',
  ui: 'dropdown',
  sourceId: source,
  beforeId: undefined,
  styles: createSharedOffStreetStyles(privateFilter),
}
