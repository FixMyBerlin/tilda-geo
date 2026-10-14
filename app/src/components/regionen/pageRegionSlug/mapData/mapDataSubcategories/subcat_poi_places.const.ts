import type { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { layers_places } from './layers/places'
import { layers_placescircle } from './layers/placescircle'
import { wrapSourceLayers } from './layers/utils/wrapSourceLayers'

const subcatId = 'poiPlaces'
export type SubcatPoiPlacesId = typeof subcatId
export type SubcatPoiPlacesStyleIds = 'default' | 'circle'

export const subcat_poi_places: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Orte',
  ui: 'dropdown',
  sourceId: 'atlas_places',
  styles: [
    defaultStyleHidden,
    {
      id: 'default',
      name: 'Siedlungszentren Name',
      layers: wrapSourceLayers({
        layers: layers_places,
        source: 'atlas_places',
        sourceLayer: 'places',
      }),
      legends: [
        {
          id: 'place',
          name: 'Orte (Name)',
          style: { type: 'text', color: 'black' },
        },
      ],
    },
    {
      id: 'circle',
      name: 'Siedlungszentren EW-Zahl',
      layers: wrapSourceLayers({
        layers: layers_placescircle,
        source: 'atlas_places',
        sourceLayer: 'places',
      }),
      legends: [
        {
          id: 'place',
          name: 'Orte (ø prop. EW-Zahl)',
          // TODO: Introduce circleBorder
          style: { type: 'circle', color: '#6D28D9' },
        },
      ],
    },
  ],
}
