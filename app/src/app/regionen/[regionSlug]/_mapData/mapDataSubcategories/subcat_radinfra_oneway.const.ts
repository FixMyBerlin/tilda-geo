import { FileMapDataSubcategory, FileMapDataSubcategoryStyleLegend } from '../types'
import { mapboxStyleGroupLayers_radinfra_oneway } from './mapboxStyles/groups/radinfra_oneway'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'bikelanes'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatRadinfraOnewayId = typeof subcatId
export type SubcatRadinfraOnewayStyleIds = 'default'

export const bikelanesOnewayLegend: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'yes',
    name: 'eine Richtung',
    style: {
      type: 'line',
      color: '#a1e217',
    },
  },
  {
    id: 'no',
    name: 'beide Richtungen',
    style: {
      type: 'line',
      color: '#00c29e',
    },
  },
  {
    id: 'no_bike',
    name: 'beide Richtungen für Fahrrad',
    style: {
      type: 'line',
      color: '#00c29e',
      dasharray: [3, 2],
    },
  },
  {
    id: 'assumed_no',
    name: 'Zu prüfen: beide Richtungen?',
    style: {
      type: 'line',
      color: '#fda5e4',
      dasharray: [3, 2],
      width: 2,
    },
  },
  {
    id: 'implicit_yes',
    name: 'Zu prüfen: eine Richtung?',
    style: {
      type: 'line',
      color: '#d8a5fd',
      dasharray: [3, 2],
      width: 2,
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

export const subcat_radinfra_oneway: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Verkehrsrichtung',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Verkehrsrichtung', // field hidden
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_radinfra_oneway,
        source,
        sourceLayer,
      }),
      legends: bikelanesOnewayLegend,
    },
  ],
}
