import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_park_street_completeness } from './mapboxStyles/groups/park_street_completeness'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTildaMissing'
const source = 'tilda_parkings_no'
const sourceLayer = 'parkings_no'
export type SubcatParkingTildaCompletenessId = typeof subcatId
export type SubcatParkingTildaCompletenessStyleIds = 'default'

export const subcat_parkingTilda_street_completeness: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Vollständigkeit',
  ui: 'checkbox',
  sourceId: source,
  beforeId: undefined,
  styles: [
    {
      id: 'default',
      name: 'Standard',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_park_street_completeness,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'not-expected',
          name: 'Kein Parken zu erwarten',
          desc: [
            'Abschnitte mit `parking=no` oder `parking=separate` — hier wird kein Straßenparken modelliert.',
          ],
          style: { type: 'line', color: '#ff8500', width: 5 },
        },
        {
          id: 'missing',
          name: 'Daten in OSM fehlen',
          desc: [
            'Abschnitte mit `parking=missing` — in OSM ist der Parkstand noch nicht erfasst.',
          ],
          style: { type: 'line', color: '#000000', width: 5 },
        },
        {
          id: 'too-small',
          name: 'Kein Parken zu erwarten (Größe)',
          desc: [
            'Abschnitte mit `reason=capacity_below_zero` — zu kurz für die Referenzfahrzeuglänge, daher kein Parkstand.',
          ],
          style: { type: 'line', color: '#b0b0b0', width: 5 },
        },
      ],
    },
  ],
}
