import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_tilda_parkings_completeness } from './mapboxStyles/groups/tilda_parkings_completeness'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'parkingTildaMissing'
const source = 'tilda_parkings_no'
const sourceLayer = 'parkings_no'
export type SubcatParkingTildaCompletenessId = typeof subcatId
export type SubcatParkingTildaCompletenessStyleIds = 'default'

export const subcat_parkingTilda_completeness: FileMapDataSubcategory = {
  id: subcatId,
  name: 'Vollständigkeit',
  ui: 'checkbox',
  sourceId: source,
  beforeId: undefined,
  styles: [
    {
      id: 'default',
      name: 'Standard',
      desc: null,
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_tilda_parkings_completeness,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'missing',
          name: 'Daten in OSM fehlen',
          desc: ['Für diesen Abschnitt sind noch keine Daten in OpenStreetMap hinterlegt.'],
          style: { type: 'line', color: 'rgb(187, 17, 133)', width: 5 },
        },
        {
          id: 'not-expected',
          name: 'Kein Parken zu erwarten',
          desc: [
            'Für diesen Abschnitt sind zwar noch keine Daten in OpenStreetMap hinterlegt, aber wir gehen davon aus, dass hier nicht geparkt werden darf.',
          ],
          style: { type: 'line', color: 'rgb(116, 88, 107)', width: 5 },
        },
        {
          id: 'too-small',
          name: 'Kein Parken zu erwarten (Größe)',
          desc: [
            'Dieser Abschnitt ist zu klein als das ein Fahrzeug in Referenzgröße hier parken könnte. Dieser Abschnitt wurde daher nicht als Parkstand bewertet.',
          ],
          style: { type: 'line', color: 'rgb(182, 164, 164)', width: 5 },
        },
      ],
    },
  ],
}
