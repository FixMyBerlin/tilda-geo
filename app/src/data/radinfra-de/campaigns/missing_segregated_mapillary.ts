import { CampaignType } from '../schema/campaignsSchema'

export const missing_segregated_mapillary: CampaignType = {
  id: 'missing_segregated_mapillary',
  todoKey: 'missing_segregated',
  title: 'Gemeinsame oder getrennte Führung? (Mapillary)',
  pubDate: new Date('2025-05-26T15:00'),
  category: 'radinfra',
  recommendedAction: 'maproulette',
  visibility: 'secondary',
  description:
    'Diese Kampagne enthält Wege, die sowohl von Fahrrad- als auch Fußverkehr genutzt werden. Es fehlt aber die Angabe, ob eine Trennung der Verkehrsformen vorliegt. Zudem sind nur Wege enthalten, für die Mapillary-Straßenfotos verfügbar sind.',
  task: '**Bitte ergänze die Angabe `segregated=yes` oder `no`.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=ife2uk.1a3pg.f6&v=2',
  maprouletteChallenge: {
    enabled: true,
    // id: ,
    checkinComment: 'Angabe zu `segregated` ergänzt.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
    filterMapillary: 'pano_regular',
  },
  taskTemplate: `
Dieser Weg wird vom Fußverkehr und Radverkehr genutzt (laut Verkehrszeichen oder Zugangs-Tagging).

## Aufgabe

**Bitte ergänze die Angabe, ob die Verkehrsformen getrennt oder gemeinsam geführt werden:**

* \`segregated=yes\`, wenn eine Trennung vorliegt, beispielweise durch eine farbige Linie ([Getr. Rad- und Gehweg](https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:241-30))).
* \`segregated=no\`, wenn keine Trennung vorliegt ([Gem. Geh- und Radweg](https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:240)).

Die Angabe, ob ein Verkehrszeichen vorliegt ist unabhängig davon, wie die Infrastruktur vor Ort wahrgenommen wird. In Ausnahmen kann es zu differenzen kommen, wenn das Verkehrszeichen \`241\` eine Trennung angibt aber (Abschnittsweise) keine Trennung zu erkennen ist.

Ergänze gerne auch einen \`mapillary=*\` Tag auf dem das Verkehrszeichen zu sehen ist.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)
`,
}
