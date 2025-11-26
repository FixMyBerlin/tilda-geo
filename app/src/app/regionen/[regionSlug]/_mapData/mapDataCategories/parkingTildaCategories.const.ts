import { subcat_parkingTilda_completeness } from '../mapDataSubcategories/subcat_parkingTilda_completeness.const'
import { subcat_parkingTilda_cutout } from '../mapDataSubcategories/subcat_parkingTilda_cutout.const'
import { subcat_parkingTilda_line } from '../mapDataSubcategories/subcat_parkingTilda_line.const'
import { subcat_parkingTilda_no } from '../mapDataSubcategories/subcat_parkingTilda_no.const'
import { subcat_parkingTilda_off_street } from '../mapDataSubcategories/subcat_parkingTilda_off_street'
import { subcat_parkingTilda_private } from '../mapDataSubcategories/subcat_parkingTilda_private.const'
import { subcat_parkingTilda_quantized } from '../mapDataSubcategories/subcat_parkingTilda_quantized.const'
import { StaticMapDataCategory } from '../types'

export const parkingTildaCategories: StaticMapDataCategory[] = [
  {
    id: 'parkingTilda',
    name: 'Parkraum (Beta)',
    desc: 'TILDA Parkraum Prozessierung',
    subcategories: [
      { ...subcat_parkingTilda_line, defaultStyle: 'default' },
      { ...subcat_parkingTilda_private, defaultStyle: 'hidden' },
      { ...subcat_parkingTilda_off_street, defaultStyle: 'hidden' },
      // { ...subcat_parkingTilda_private, defaultStyle: 'hidden' }, // Privates Parken abseits des Straßenraums
      { ...subcat_parkingTilda_no, defaultStyle: 'hidden' },
      { ...subcat_parkingTilda_cutout, defaultStyle: 'hidden' },
      { ...subcat_parkingTilda_completeness, defaultStyle: 'hidden' },
      { ...subcat_parkingTilda_quantized, defaultStyle: 'hidden' },
      // { ...subcat_parkingTilda_off_street_quantized, defaultStyle: 'hidden' },
    ],
  },
]
