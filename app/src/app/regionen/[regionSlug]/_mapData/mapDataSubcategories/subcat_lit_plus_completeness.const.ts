import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_atlas_lit_complete } from './mapboxStyles/groups/atlas_lit_complete'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'lit-completeness'
const source = 'atlas_roads'
const sourceLayer = 'roads'
export type SubcatLitPlusCompletenessId = typeof subcatId
export type SubcatLitPlusCompletenessStyleIds = 'default'

export const subcat_lit_plus_completeness: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Vollständigkeit',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'completeness',
      name: 'Vollständigkeit',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_lit_complete,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'missing',
          name: 'Daten fehlen',
          style: {
            type: 'line',
            color: '#fa80f4',
          },
        },
      ],
    },
  ],
}
