import { CampaignType } from '../schema/campaignsSchema'

export const unexpected_highway_path: CampaignType = {
  id: 'unexpected_highway_path',
  title: 'Straßenklasse Pfad unerwartet',
  pubDate: new Date('2025-10-01T15:00'),
  category: 'radinfra',
  recommendedAction: 'maproulette',
  visibility: 'hidden',
  description:
    'Diese Kampagne enthält Wege wo Fußverkehr ausgeschlossen aber Radverkehr vorgesehen sind.',
  task: '**Bitte prüfe das Tagging. Eventuell ist eine andere Straßenklasse angebracht.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=ife2uk.50y84.f6&v=2',
  maprouletteChallenge: {
    enabled: true,
    id: undefined,
    checkinComment: 'Straßenklasse Pfad in Kombination mit Radinfrastruktur verbessert.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
  },
  taskTemplate: `
Dieser Weg verwendet eine unerwarte Kombination an Tags: Er ist als Pfad attributiert mit Verbot für Fußverkehr und vorgesehen für Radverkehr.

## Aufgabe

**Bitte prüfe und korrigieren die Tags.**

Prüfe mit Mapillary (s.u.) oder vor Ort, welches Infrastruktur vorliegt.

Tagging-Empfehlungen:

* Ist es ein ein **Radweg**? Dann ändere \`highway\` Wert zu \`path\`. Ergänze, wenn vorhanden, [das Verkehrszeichen](https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:237) \`traffic_sign=DE:237\`.

* Ist es ein ein Alltags-Radweg sondern ein Weg für **Mountainbiker:innen**? Dann ergänzt [passende Mountain biking tags](https://wiki.openstreetmap.org/wiki/DE:Mountain_biking) wie bspw. \`mtb=yes\`, \`mtb:scale=*\` oder einer der im Wiki erwähnten Oberflächen-Tags um den Weg von Alltags-Radwegen zu unterscheiden.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)
`,
}
