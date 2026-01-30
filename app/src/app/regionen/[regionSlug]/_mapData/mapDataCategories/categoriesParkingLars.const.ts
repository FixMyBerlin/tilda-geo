import { subcat_parkingLars } from '../mapDataSubcategories/subcat_parkingLars.const'
import { subcat_parkingLarsAreas } from '../mapDataSubcategories/subcat_parkingLarsAreas.const'
import { subcat_parkingLarsBoundaries } from '../mapDataSubcategories/subcat_parkingLarsBoundaries.const'
import { subcat_parkingLarsDebug } from '../mapDataSubcategories/subcat_parkingLarsDebug.const'
import { subcat_parkingLarsPoints } from '../mapDataSubcategories/subcat_parkingLarsPoints.const'
import { subcat_parkingLarsStats } from '../mapDataSubcategories/subcat_parkingLarsStats.const'
import { subcat_signs } from '../mapDataSubcategories/subcat_signs.const'
import { StaticMapDataCategory } from '../types'

export const categoriesParkingLars: StaticMapDataCategory[] = [
  {
    id: 'parkingLars',
    name: 'Parkraum (Community)',
    desc: 'Parken im Straßenraum – Community-Prozessierung',
    subcategories: [
      { ...subcat_parkingLars, defaultStyle: 'default' },
      { ...subcat_parkingLarsPoints, defaultStyle: 'hidden' },
      { ...subcat_parkingLarsAreas, defaultStyle: 'default' },
      { ...subcat_parkingLarsDebug, defaultStyle: 'hidden' },
      { ...subcat_parkingLarsStats, defaultStyle: 'hidden' },
      { ...subcat_parkingLarsBoundaries, defaultStyle: 'hidden' },
      { ...subcat_signs, defaultStyle: 'hidden' },
      // { id: 'mapillaryCoverage', defaultStyle: "hidden" },
      // { id: 'accidents', defaultStyle: "hidden" },
    ],
  },
]
