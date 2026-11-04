import type { ExpressionSpecification } from 'maplibre-gl'
import type { FileMapDataSubcategory } from '../types'

const subcatId = 'poiPlusEntrances'
const source = 'atlas_entrances'
const sourceLayer = 'entrances'
export type SubcatPoiPlusEntrancesId = typeof subcatId
export type SubcatPoiPlusEntrancesStyleIds = 'default'

const isPublicTransport: ExpressionSpecification = ['==', ['get', 'category'], 'public_transport']
// Same values as the default `kinds` of `PostgisLoader.load_building_entrances` in the
// space-finder-worker (entrances that would be relevant to residents; no score uses them yet).
const mainEntranceValues = ['yes', 'main', 'home', 'staircase']
const isMainEntrance: ExpressionSpecification = [
  'in',
  ['get', 'entrance'],
  ['literal', mainEntranceValues],
]
const publicTransportColor = '#1d4ed8'
const mainColor = '#be185d'
const otherColor = '#94a3b8'

export const subcat_poi_plus_entrances: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Eingänge',
  ui: 'checkbox',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'Standard',
      layers: [
        {
          id: 'entrances',
          type: 'circle',
          source,
          'source-layer': sourceLayer,
          minzoom: 16,
          paint: {
            'circle-color': [
              'case',
              isPublicTransport,
              publicTransportColor,
              isMainEntrance,
              mainColor,
              otherColor,
            ],
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 16, 3, 20, 6],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1,
          },
        },
      ],
      legends: [
        {
          id: 'public_transport',
          name: 'U-Bahn-Eingang',
          desc: ['`railway=subway_entrance`'],
          style: { type: 'circle', color: publicTransportColor },
        },
        {
          id: 'main',
          name: 'Gebäudeeingang',
          desc: [
            '`entrance=main`, `entrance=home`, `entrance=staircase`',
            '`entrance=yes`: Eingänge ohne nähere Angabe',
          ],
          style: { type: 'circle', color: mainColor },
        },
        {
          id: 'other',
          name: 'Neben-/Notausgang',
          desc: [
            'Alle übrigen `entrance`-Werte, u. a. `entrance=exit`, `entrance=service`, `entrance=emergency`, `entrance=secondary`, `entrance=shop`',
          ],
          style: { type: 'circle', color: otherColor },
        },
      ],
    },
  ],
}
