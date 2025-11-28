import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_atlas_pois_default } from './mapboxStyles/groups/atlas_pois_default'
import { mapboxStyleGroupLayers_atlas_pois_education } from './mapboxStyles/groups/atlas_pois_education'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'poi'
const source = 'atlas_poiClassification'
const sourceLayer = 'poiClassification'
export type SubcatPoiId = typeof subcatId
export type SubcatPoiStyleIds = 'default' | 'education'

export const subcat_poi: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Quellen & Ziele',
  ui: 'dropdown',
  sourceId: source,
  styles: [
    defaultStyleHidden,
    // TODO "Details" see https://www.figma.com/file/N9LROlksQn4tGHZp0k0KeS/OSM-Atlas?type=design&node-id=1005-8419&mode=design&t=sIuuLD4vxJJzKOWr-0
    // TODO "Nur S/W"
    {
      id: 'default',
      name: 'Einfach',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_pois_default,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'bildung',
          name: 'Bildung',
          style: { type: 'circle', color: '#3568de' },
        },
        {
          id: 'einkauf',
          name: 'Einkauf',
          style: { type: 'circle', color: '#80e5d1' },
        },
        {
          id: 'freizeit',
          name: 'Freizeit',
          style: { type: 'circle', color: '#b1e755' },
        },
        {
          id: 'besorgungen',
          name: 'Grundversorgung',
          style: { type: 'circle', color: '#f18241' },
        },
        {
          id: 'heatmap',
          name: 'Heatmap',
          style: {
            type: 'heatmap',
            color: '#952a09',
          },
        },
      ],
    },
    {
      id: 'education',
      name: 'Bildung und Kitas',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_pois_education,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'children',
          name: 'Kindergarten',
          style: {
            type: 'circle',
            color: '#19a1b3',
          },
        },
        {
          id: 'school',
          name: 'Schule',
          style: {
            type: 'circle',
            color: '#1269e2',
          },
        },
        {
          id: 'uni',
          name: 'Hochschulen & Forschung',
          style: {
            type: 'circle',
            color: '#b070ff',
          },
        },
        {
          id: 'heatmap',
          name: 'Heatmap',
          style: {
            type: 'heatmap',
            color: '#1269e2',
          },
        },
      ],
    },
  ],
}
