import { mapillaryCoverageDateString } from '../../mapillaryCoverage.const'
import { CampaignType } from '../schema/campaignsSchema'

export const currentness_too_old__mapillary: CampaignType = {
  id: 'currentness_too_old__mapillary',
  title: 'Sehr lange nicht geprüfte Radinfra',
  pubDate: new Date('2025-05-28T15:00'),
  category: 'currentness',
  recommendedAction: 'maproulette',
  visibility: 'promote',
  description: 'Diese Kampagne enthält Wege, die seit mehr als 10 Jahren nicht editiert wurden.',
  task: '**Bitte prüfe und aktualisiere diese Infrastruktur.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=ife2uk.a0qx0.f6&v=2', // TODO
  maprouletteChallenge: {
    enabled: true,
    // id: ,
    checkinComment: 'Radinfrastruktur überprüft.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
  },
  taskTemplate: `
Dieser Weg ist seit vielen Jahren nicht mehr überprüft worden.

## Aufgabe

**Bitte prüfe und aktualisiere diese Infrastruktur:**

* Wenn du Tags veränderst, wird automatisch das Datum der letzten Bearbeitung aktualisiert. (Reine Geometrie-Änderungen ändern das Datum dagegen nicht.)
* Wenn bereits alles richtig getaggt ist, ergänze \`check_date=2025-MM-TT\` um zu hinterlegen, dass aus deiner Sicht alles aktuell ist.
* Wenn möglich, ergänze bitte auch das Verkehrszeichen ([Tagging-Hilfe](https://trafficsigns.osm-verkehrswende.org/)) bzw. \`traffic_sign=none\`.
* Wenn du ein aussagekräftiges Foto in Mapillary siehst, füge es als \`mapillary=IMAGE_KEY\` hinzu.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)

Hinweis Mapillary: Diese Kampagne enthält nur Wege, für die Mapillary-Bilder erkannt wurden. Es werden Mapillary-Bilder bis ${mapillaryCoverageDateString} berücksichtigt. Diese Daten werden nur alle paar Monate aktualisiert.`,
}
