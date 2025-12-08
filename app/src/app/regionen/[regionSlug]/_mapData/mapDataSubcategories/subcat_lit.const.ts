import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_atlas_lit } from './mapboxStyles/groups/atlas_lit'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'lit'
const source = 'atlas_roads'
const sourceLayer = 'roads'
export type SubcatLitId = typeof subcatId
export type SubcatLitStyleIds = 'default' | 'lit'

export const subcat_lit: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Beleuchtung',
  ui: 'dropdown',
  sourceId: source,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Beleuchtung',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_lit,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'lit',
          name: 'Beleuchtet',
          style: {
            type: 'line',
            color: '#f8c52a',
          },
        },
        {
          id: 'lit-special',
          name: 'Beleuchtet (Sonderfälle)',
          style: {
            type: 'line',
            color: '#ffac38',
          },
        },
        {
          id: 'unlit',
          name: 'Unbeleuchtet',
          style: {
            type: 'line',
            color: '#736e59',
          },
        },
      ],
    },
    {
      id: 'lit',
      name: 'Beleuchtet',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_lit,
        source,
        sourceLayer,
        additionalFilter: ['match', ['get', 'lit'], ['no'], false, true],
      }),
      legends: [
        {
          id: 'lit',
          name: 'Beleuchtet',
          style: {
            type: 'line',
            color: '#f8c52a',
          },
        },
        {
          id: 'lit-special',
          name: 'Beleuchtet (Sonderfälle)',
          style: {
            type: 'line',
            color: '#ffac38',
          },
        },
      ],
    },
  ],
}
