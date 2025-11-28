import { FileMapDataSubcategory } from '../types'
import { defaultStyleHidden } from './defaultStyle/defaultStyleHidden'
import { mapboxStyleGroupLayers_atlas_places } from './mapboxStyles/groups/atlas_places'
import { mapboxStyleGroupLayers_atlas_placescircle } from './mapboxStyles/groups/atlas_placescircle'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

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
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_places,
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
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_placescircle,
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
