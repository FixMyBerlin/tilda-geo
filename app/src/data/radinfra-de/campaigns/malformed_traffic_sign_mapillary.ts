import { CampaignType } from '../schema/campaignsSchema'

export const malformed_traffic_sign_mapillary: CampaignType = {
  id: 'malformed_traffic_sign_mapillary',
  todoKey: 'malformed_traffic_sign',
  title: 'Fehler im Verkehrszeichen-Tag (Mapillary)',
  pubDate: new Date('2025-05-26T15:00'),
  category: 'traffic_signs',
  recommendedAction: 'maproulette',
  visibility: 'secondary',
  description:
    'Diese Kampagne enthält Wege mit einem Fehler im Wert des `traffic_sign*`-Tags. Zudem sind nur Wege enthalten, für die Mapillary-Straßenfotos verfügbar sind.',
  task: '**Bitte prüfe und korrigiere den Wert der Tags `traffic_sign`, `traffic_sign:forward`, `traffic_sign:backward`.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=v92cax.27xwlg.3dc&v=2',
  maprouletteChallenge: {
    enabled: true,
    // id: ,
    checkinComment: '`traffic_sign:*` korrigiert.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
    filterMapillary: 'pano_regular',
  },
  taskTemplate: `
Das Verkehrszeichen-Tag an diese Weg enthält einen Fehler.

## Aufgabe

**Bitte prüfe und korrigiere den Wert der Tags \`traffic_sign\`, \`traffic_sign:forward\`, \`traffic_sign:backward\`.**

* [Das Verkehrszeichen-Tool](https://trafficsigns.osm-verkehrswende.org/DE) hilft, den richtigen Wert zu finden
* Häufig sind es Tippfehler bei \`DE:\` oder zusätzliche Leerzeichen zwischen den Trennzeichen \`,\` und \`;\`. Auch Großschreibung wird geprüft.
* Es werden auch "verschachtelte" Tags geprüft wie zum Beispiel \`cycleway:right:traffic_sign\`

## Hilfsmittel

* [OpenStreetMap](%%OSM_URL%%)
* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
`,
}
