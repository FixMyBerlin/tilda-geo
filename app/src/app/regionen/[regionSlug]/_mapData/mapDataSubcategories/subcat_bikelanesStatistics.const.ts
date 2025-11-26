import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { debugLayerStyles } from './mapboxStyles/debugLayerStyles'

const subcatId = 'bikelanesStatistics'
const source = 'atlas_presenceStats'
const sourceLayer = 'presenceStats'
export type SubcatBikelanesStatsId = typeof subcatId
export type SubcatBikelanesStatsStyleIds = 'default' | 'category_municipality'

// Docs https://wiki.openstreetmap.org/wiki/DE:Grenze#Innerstaatliche_Grenzen
export const subcat_bikelanesStatistics: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Statistik',
  ui: 'dropdown',
  sourceId: source,
  beforeId: undefined,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Landkreise & Kreisfreie Städte',
      layers: debugLayerStyles({
        source,
        sourceLayer,
        filter: ['has', 'category_district'],
      }),
    },
    {
      id: 'category_municipality',
      name: 'Gemeinden',
      layers: debugLayerStyles({
        source,
        sourceLayer,
        filter: ['has', 'category_municipality'],
      }),
    },
  ],
}
