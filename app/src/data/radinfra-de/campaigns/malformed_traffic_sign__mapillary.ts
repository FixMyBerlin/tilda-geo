import { mapillaryCoverageDateString } from '../../mapillaryCoverage.const'
import { CampaignType } from '../schema/campaignsSchema'

export const malformed_traffic_sign__mapillary: CampaignType = {
  id: 'malformed_traffic_sign__mapillary',
  title: 'Fehler im Verkehrszeichen-Tag (Mapillary)',
  pubDate: new Date('2025-05-28T10:00'),
  category: 'traffic_signs',
  recommendedAction: 'maproulette',
  visibility: 'secondary',
  description: 'Diese Kampagne enthält Wege mit einem Fehler im Wert des `traffic_sign*`-Tags',
  task: '**Bitte prüfe und korrigiere den Wert der Tags `traffic_sign`, `traffic_sign:forward`, `traffic_sign:backward`.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=1v92rco.1431hg.4pt3i8&v=2',
  maprouletteChallenge: {
    enabled: true,
    id: 52422,
    checkinComment: '`traffic_sign:*` korrigiert.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
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

Hinweis Mapillary: Diese Kampagne enthält nur Wege, für die Mapillary-Bilder erkannt wurden. Es werden Mapillary-Bilder bis ${mapillaryCoverageDateString} berücksichtigt. Diese Daten werden nur alle paar Monate aktualisiert.`,
}
