import { FileMapDataSubcategory } from '../types'
import { mapboxStyleGroupLayers_atlas_bikelane_presence } from './mapboxStyles/groups/atlas_bikelane_presence'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'

const subcatId = 'bikelanes_plus_presence'
const source = 'atlas_bikelanesPresence'
const sourceLayer = 'bikelanesPresence'
export type SubcatBikelanesPlusPresenceId = typeof subcatId
export type SubcatBikelanesPlusPresenceStyleIds = 'default'

export const bikelanesPresenceColors = {
  missing: '#fa80f4',
  data_no: 'rgba(108, 124, 147, 0.67)',
  data_present: 'rgba(142, 177, 240, 0.7)',
  not_expected: 'rgba(234, 200, 210, 0.68)',
  assumed_no: 'rgba(251, 172, 196, 0.69)',
}

export const subcat_bikelanes_plus_presence: FileMapDataSubcategory = {
  id: subcatId,
  name: 'RVA Vollständigkeit',
  ui: 'checkbox',
  sourceId: source,
  beforeId: 'boundary_country_outline',
  styles: [
    {
      id: 'default',
      name: 'Vollständigkeit',
      layers: mapboxStyleLayers({
        layers: mapboxStyleGroupLayers_atlas_bikelane_presence,
        source,
        sourceLayer,
      }),
      legends: [
        {
          id: 'missing',
          name: 'Daten fehlen',
          style: {
            type: 'line',
            color: bikelanesPresenceColors.missing,
          },
        },
        {
          id: 'data_no', // cycleway=no
          name: 'Kein Radweg',
          style: {
            type: 'line',
            color: bikelanesPresenceColors.data_no,
          },
        },
        {
          id: 'data-present',
          name: 'RVA vorhanden',
          style: {
            type: 'line',
            color: bikelanesPresenceColors.data_present,
          },
        },
        {
          id: 'not_expected',
          name: 'Keine RVA erwartet',
          desc: [
            'Beispiel: Auf der Fahrbahn ist keine RVA erwartet, wenn es bereits links/rechts gesonderte RVA gibt.',
            'Beispiel: Bei Wohnstraßen wiederum ist keine RVA links/rechts erwartet.',
          ],
          style: {
            type: 'line',
            color: bikelanesPresenceColors.not_expected,
          },
        },
        {
          id: 'assumed_no',
          name: 'Keine RVA vermuted',
          desc: [
            'Auf einer Landstraße ist an einer Seite ein separater Radweg angegeben, auf der anderen nicht. Wir vermuten jetzt, dass an der fehlenden Seite auch keine Infrastruktur ist. Wir machen das, um den Blick auf die Fälle, wo gar keine Daten vorliegen zu lenken.',
          ],
          style: {
            type: 'line',
            color: bikelanesPresenceColors.assumed_no,
          },
        },
      ],
    },
  ],
}
