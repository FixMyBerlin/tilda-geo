import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_atlas_maxspeed_above40 } from './mapboxStyles/groups/atlas_maxspeed_above40'
import { mapboxStyleGroupLayers_atlas_maxspeed_all } from './mapboxStyles/groups/atlas_maxspeed_all'
import { mapboxStyleGroupLayers_atlas_maxspeed_below30 } from './mapboxStyles/groups/atlas_maxspeed_below30'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'maxspeed'
const source = 'atlas_roads'
const sourceLayer = 'roads'
export type SubcatMaxspeedId = typeof subcatId
export type SubcatMaxspeedStyleIds = 'default' | 'below30' | 'above40'

export const subcat_maxspeed: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Höchstgeschwindigkeit',
  ui: 'dropdown',
  sourceId: source,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Alle Höchstgeschwindigkeiten',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_maxspeed_all,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'tl-80',
          name: 'TL ≥ 80 km/h',
          style: { type: 'line', color: '#b80505', width: 2 },
        },
        {
          id: 'tl-60',
          name: 'TL ≥ 60 km/h',
          style: { type: 'line', color: '#e92d07', width: 2 },
        },
        {
          id: 'tl-50',
          name: 'TL ≥ 50 km/h',
          style: { type: 'line', color: '#fc7c40', width: 2 },
        },
        {
          id: 'tl-40',
          name: 'TL ≥ 40 km/h',
          style: { type: 'line', color: '#eeb449', width: 2 },
        },
        {
          id: 'tl-30',
          name: 'TL ≥ 30 km/h',
          style: { type: 'line', color: '#2cb587', width: 2 },
        },
        {
          id: 'tl-20',
          name: 'TL ≥ 20 km/h',
          style: { type: 'line', color: '#08aec4', width: 2 },
        },
      ],
    },
    {
      id: 'below30',
      name: 'Nur Höchstgeschwindigkeit ≤30 km/h',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_maxspeed_below30,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'tl-30',
          name: 'TL ≥ 30 km/h',
          style: { type: 'line', color: '#2cb587', width: 2 },
        },
        {
          id: 'tl-20',
          name: 'TL ≥ 20 km/h',
          style: { type: 'line', color: '#08aec4', width: 2 },
        },
      ],
    },
    {
      id: 'above40',
      name: 'Nur Höchstgeschwindigkeiten ≥40 km/h',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_maxspeed_above40,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'tl-80',
          name: 'TL ≥ 80 km/h',
          style: { type: 'line', color: '#b80505', width: 2 },
        },
        {
          id: 'tl-60',
          name: 'TL ≥ 60 km/h',
          style: { type: 'line', color: '#e92d07', width: 2 },
        },
        {
          id: 'tl-50',
          name: 'TL ≥ 50 km/h',
          style: { type: 'line', color: '#fc7c40', width: 2 },
        },
        {
          id: 'tl-40',
          name: 'TL ≥ 40 km/h',
          style: { type: 'line', color: '#eeb449', width: 2 },
        },
      ],
    },
  ],
}
