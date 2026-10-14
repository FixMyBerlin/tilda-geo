import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { layers_roads_all } from './layers/roads_all'
import { layers_roads_mainstreets } from './layers/roads_mainstreets'
import { layers_roads_mainstreets_classified } from './layers/roads_mainstreets_classified'
import { layers_roads_sidestreets } from './layers/roads_sidestreets'
import { structureIconLayers } from './layers/structureIconLayers'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

const subcatId = 'roads'
const source = 'atlas_roads'
const sourceLayer = 'roads'
export type SubcatRoadsId = typeof subcatId
export type SubcatRoadsStyleIds = 'default' | 'sidestreets' | 'mainstreets' | 'classified'

const structureIcons = structureIconLayers({ source, sourceLayer })

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
      layers: [
        ...wrapSourceLayers({
          layers: layers_roads_all,
          source,
          sourceLayer,
        }),
        ...structureIcons,
      ],
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
      layers: [
        ...wrapSourceLayers({
          layers: layers_roads_sidestreets,
          source,
          sourceLayer,
        }),
        ...structureIcons,
      ],
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
      layers: [
        ...wrapSourceLayers({
          layers: layers_roads_mainstreets,
          source,
          sourceLayer,
        }),
        ...structureIcons,
      ],
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
      layers: [
        ...wrapSourceLayers({
          layers: layers_roads_mainstreets_classified,
          source,
          sourceLayer,
        }),
        ...structureIcons,
      ],
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
