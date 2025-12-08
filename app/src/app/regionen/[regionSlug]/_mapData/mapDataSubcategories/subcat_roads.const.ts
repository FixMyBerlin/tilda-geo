import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_atlas_roads_all } from './mapboxStyles/groups/atlas_roads_all'
import { mapboxStyleGroupLayers_atlas_roads_mainstreets } from './mapboxStyles/groups/atlas_roads_mainstreets'
import { mapboxStyleGroupLayers_atlas_roads_mainstreets_classified } from './mapboxStyles/groups/atlas_roads_mainstreets_classified'
import { mapboxStyleGroupLayers_atlas_roads_sidestreets } from './mapboxStyles/groups/atlas_roads_sidestreets'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'roads'
const source = 'atlas_roads'
const sourceLayer = 'roads'
export type SubcatRoadsId = typeof subcatId
export type SubcatRoadsStyleIds = 'default' | 'sidestreets' | 'mainstreets' | 'classified'
export const subcat_roads: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Straßentypen',
  ui: 'dropdown',
  sourceId: source,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Alle',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_roads_all,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'main',
          name: 'Hauptstraßen',
          style: { type: 'line', color: '#f6e7ac', width: 8 },
        },
        {
          id: 'side-high',
          name: 'Nebenstraßen',
          style: { type: 'line', color: '#ffdb70', width: 5 },
        },
        {
          id: 'residential',
          name: 'Wohnstraßen',
          style: { type: 'line', color: '#a2c9f6', width: 2 },
        },
        {
          id: 'low-traffic',
          name: 'Verkehrsberuhigt',
          style: { type: 'line', color: '#447be9', width: 2 },
        },
        {
          id: 'service',
          name: 'Zufahrtswege',
          style: { type: 'line', color: '#96e4b4', width: 2 },
        },
        {
          id: 'trunk',
          name: 'Autobahn',
          style: { type: 'line', color: '#828282', width: 1 },
        },
      ],
    },
    {
      id: 'sidestreets',
      name: 'Nur Nebenstraßen',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_roads_sidestreets,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'side-high',
          name: 'Nebenstraßen',
          style: { type: 'line', color: '#ffdb70', width: 5 },
        },
        {
          id: 'residential',
          name: 'Wohnstraßen',
          style: { type: 'line', color: '#a2c9f6', width: 2 },
        },
        {
          id: 'low-traffic',
          name: 'Verkehrsberuhigt',
          style: { type: 'line', color: '#447be9', width: 2 },
        },
        {
          id: 'service',
          name: 'Zufahrtswege',
          style: { type: 'line', color: '#96e4b4', width: 2 },
        },
      ],
    },
    {
      id: 'mainstreets',
      name: 'Nur Hauptstraßen',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_roads_mainstreets,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'main',
          name: 'Hauptstraßen',
          style: { type: 'line', color: '#f6e7ac', width: 8 },
        },
        {
          id: 'trunk',
          name: 'Autobahn',
          style: { type: 'line', color: '#828282', width: 1 },
        },
      ],
    },
    {
      id: 'classified',
      name: 'Klassifizierung',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_roads_mainstreets_classified,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'bundesstraßen',
          name: 'Bundesstraßen',
          style: { type: 'line', color: '#1992f5', width: 3 },
        },
        {
          id: 'landesstraßen',
          name: 'Landesstraßen',
          style: { type: 'line', color: '#07b072', width: 3 },
        },
        {
          id: 'kreissttraßen',
          name: 'Kreissttraßen und weitere Klassen',
          style: { type: 'line', color: '#cab007', width: 3 },
        },
        {
          id: 'autobahnen',
          name: 'Autobahnen',
          style: { type: 'line', color: '#828282', width: 1 },
        },
      ],
    },
  ],
}
