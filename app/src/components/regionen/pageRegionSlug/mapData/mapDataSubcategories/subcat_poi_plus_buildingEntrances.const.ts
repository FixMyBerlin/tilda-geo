import type { ExpressionSpecification } from 'maplibre-gl'
import type { FileMapDataSubcategory } from '../types'

const subcatId = 'poiPlusBuildingEntrances'
const source = 'atlas_buildingEntrances'
const sourceLayer = 'buildingEntrances'
export type SubcatPoiPlusBuildingEntrancesId = typeof subcatId
export type SubcatPoiPlusBuildingEntrancesStyleIds = 'default'

// Same values the planning-worker counts as residents' entrances
// (`PostgisLoader.load_building_entrances`, default `kinds`).
const mainEntranceValues = ['yes', 'main', 'home', 'staircase']
const isMainEntrance: ExpressionSpecification = [
  'in',
  ['get', 'entrance'],
  ['literal', mainEntranceValues],
]
const mainColor = '#be185d'
const otherColor = '#94a3b8'

export const subcat_poi_plus_buildingEntrances: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Gebäudeeingänge',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Standard',
      layers: [
        {
          id: 'building-entrances',
          type: 'circle',
          source,
          'source-layer': sourceLayer,
          minzoom: 16,
          paint: {
            'circle-color': ['case', isMainEntrance, mainColor, otherColor],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 16, 3, 20, 6],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
          },
        },
      ],
      legends: [
        {
          id: 'main',
          name: 'Haupt-/Wohneingang',
          style: { type: 'circle', color: mainColor },
        },
        {
          id: 'other',
          name: 'Sonstiger Eingang',
          style: { type: 'circle', color: otherColor },
        },
      ],
    },
  ],
}
