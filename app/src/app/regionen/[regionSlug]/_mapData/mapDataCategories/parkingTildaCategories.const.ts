import { subcat_parkingTilda } from '../mapDataSubcategories/subcat_parkingTilda.const'
import { subcat_parkingTildaCutouts } from '../mapDataSubcategories/subcat_parkingTildaCutouts.const'
import { subcat_parkingTildaNo } from '../mapDataSubcategories/subcat_parkingTildaNo.const'
import { subcat_parkingTildaQuantized } from '../mapDataSubcategories/subcat_parkingTildaQuantized.const'
import { subcat_parkingTildaSeparate } from '../mapDataSubcategories/subcat_parkingTildaSeparate.const'
import { StaticMapDataCategory } from '../types'

export const parkingTildaCategories: StaticMapDataCategory[] = [
  {
    id: 'parkingTilda',
    name: 'Parkraum',
    desc: 'TILDA Parkraum Prozessierung',
    subcategories: [
      { ...subcat_parkingTilda, defaultStyle: 'default' },
      { ...subcat_parkingTildaCutouts, defaultStyle: 'hidden' },
      { ...subcat_parkingTildaQuantized, defaultStyle: 'hidden' },
      { ...subcat_parkingTildaSeparate, defaultStyle: 'default' },
      { ...subcat_parkingTildaNo, defaultStyle: 'hidden' },
    ],
  },
]
