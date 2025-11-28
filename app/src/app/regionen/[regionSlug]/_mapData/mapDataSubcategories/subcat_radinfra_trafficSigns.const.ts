import { FileMapDataSubcategory, FileMapDataSubcategoryStyleLegend } from '../types'
import { mapboxStyleGroupLayers_radinfra_traffic_signs } from './mapboxStyles/groups/radinfra_traffic_signs'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'bikelanes'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatBikelanesId = typeof subcatId
export type SubcatBikelanesStyleIds = 'default'
export const bikelanesTrafficSignLegend: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'present',
    name: 'Beschildert',
    style: {
      type: 'line',
      color: '#a1e217',
    },
  },
  {
    id: 'none',
    name: 'Unbeschildert (explizit)',
    style: {
      type: 'line',
      color: '#00c29e',
    },
  },
  {
    id: 'missing',
    name: 'Angaben fehlen',
    style: {
      type: 'line',
      color: '#fda5e4',
    },
  },
  {
    id: 'zoom_needed',
    name: 'Auf dieser Zoomstufe können die Daten nicht angezeigt werden',
    style: {
      type: 'line',
      color: 'gray',
    },
  },
]

export const subcat_radinfra_trafficSigns: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Beschilderung',
  ui: 'checkbox',
  beforeId: 'atlas-app-beforeid-top',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Beschilderung', // field hidden
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_radinfra_traffic_signs,
        source,
        sourceLayer,
      }),
      legends: bikelanesTrafficSignLegend,
    },
  ],
}
