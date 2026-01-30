import { subcat_parkingTilda_offStreet_private } from '../mapDataSubcategories/subcat_parkingTilda_offStreet_private.const'
import { subcat_parkingTilda_offStreet_public } from '../mapDataSubcategories/subcat_parkingTilda_offStreet_public.const'
import { subcat_parkingTilda_offStreet_quantized } from '../mapDataSubcategories/subcat_parkingTilda_offStreet_quantized.const'
import { subcat_parkingTilda_street_completeness } from '../mapDataSubcategories/subcat_parkingTilda_street_completeness.const'
import { subcat_parkingTilda_street_cutout } from '../mapDataSubcategories/subcat_parkingTilda_street_cutout.const'
import { subcat_parkingTilda_street_no } from '../mapDataSubcategories/subcat_parkingTilda_street_no.const'
import { subcat_parkingTilda_street_private } from '../mapDataSubcategories/subcat_parkingTilda_street_private.const'
import { subcat_parkingTilda_street_public } from '../mapDataSubcategories/subcat_parkingTilda_street_public.const'
import { subcat_parkingTilda_street_quantized } from '../mapDataSubcategories/subcat_parkingTilda_street_quantized.const'
import { StaticMapDataCategory } from '../types'

export const categoriesParkingTilda: StaticMapDataCategory[] = [
  {
    id: 'parkingTilda',
    name: 'Parkraum (Beta)',
    desc: 'TILDA Parkraum Prozessierung',
    subcategories: [
      { ...subcat_parkingTilda_street_public, defaultStyle: 'default' },
      { ...subcat_parkingTilda_street_private, defaultStyle: 'hidden' },
      { ...subcat_parkingTilda_offStreet_public, defaultStyle: 'default' },
      { ...subcat_parkingTilda_offStreet_private, defaultStyle: 'hidden' },
      { ...subcat_parkingTilda_street_no, defaultStyle: 'hidden' },
      { ...subcat_parkingTilda_street_cutout, defaultStyle: 'hidden' },
      { ...subcat_parkingTilda_street_completeness, defaultStyle: 'hidden' },
      { ...subcat_parkingTilda_street_quantized, defaultStyle: 'hidden' },
      { ...subcat_parkingTilda_offStreet_quantized, defaultStyle: 'hidden' },
    ],
    spacerAfter: new Set([
      subcat_parkingTilda_street_private.id,
      subcat_parkingTilda_offStreet_private.id,
      subcat_parkingTilda_street_completeness.id,
    ]),
  },
]
