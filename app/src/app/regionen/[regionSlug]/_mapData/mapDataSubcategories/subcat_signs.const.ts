import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { debugLayerStyles } from './mapboxStyles/debugLayerStyles'

const subcatId = 'signs'
const source = 'atlas_trafficSigns'
const sourceLayer = 'trafficSigns'
export type SubcatSignsId = typeof subcatId
export type SubcatSignsStyleIds = 'default'

export const subcat_signs: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Verkehrszeichen (Position Schilder)',
  ui: 'dropdown',
  sourceId: source,
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Standard',
      layers: debugLayerStyles({
        source,
        sourceLayer: sourceLayer,
      }),
      // layers: mapboxStyleLayers({
      //   group: 'atlas_bikeparking_points',
      //   source,
      //   sourceLayer,
      // }),
      // legends: [
      //   {
      //     id: 'children',
      //     name: 'Kindergarten',
      //     style: {
      //       type: 'circle',
      //       color: 'rgb(119, 23, 171)',
      //     },
      //   },
      //   {
      //     id: 'older',
      //     name: 'Schule bis Uni',
      //     style: {
      //       type: 'circle',
      //       color: 'hsl(209, 76%, 38%)',
      //     },
      //   },
      // ],
    },
  ],
}
