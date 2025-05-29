import { mapillaryCoverageDateString } from '../../mapillaryCoverage.const'
import { CampaignType } from '../schema/campaignsSchema'

export const missing_oneway__mapillary: CampaignType = {
  id: 'missing_oneway__mapillary',
  title: 'Ergänze Angaben zur Verkehrsrichtung (Mapillary)',
  pubDate: new Date('2025-05-28T15:00'),
  category: 'radinfra',
  recommendedAction: 'maproulette',
  visibility: 'secondary',
  description:
    'Diese Karte zeigt Wege, bei denen die Angabe zur Verkehrsrichtung der Radinfrastruktur fehlt.',
  task: '**Bitte ergänze, ob in eine oder beide Richtungen gefahren werden darf.**',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=1ops5da.54i84.3cw&v=2', // TODO
  maprouletteChallenge: {
    enabled: true,
    // id: ,
    checkinComment: 'Angabe zu Verkehrsrichtung ergänzt.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
  },
  taskTemplate: `
Diesem Weg fehlt eine Angabe zur Verkehrsrichtung.

## Aufgabe

**Bitte ergänze die Angabe…**

* …\`oneway=yes\`, wenn nur in eine Richtung gefahren werden darf.
* …\`oneway=no\`, wenn in beide Richtungen gefahren werden darf.
* Um die Angabe nur auf Radverkehr zu beschränken, nutze \`oneway:bicycle=yes|no\`.

Ideal ist es, wenn du zusätzlich das Verkehrszeichen \`traffic_sign\` ergänzt bzw. ein explizites \`traffic_sign=none\`. [Das Verkehrszeichen-Tool](https://trafficsigns.osm-verkehrswende.org/DE) hilft dabei.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)

Hinweis Mapillary: Diese Kampagne enthält nur Wege, für die Mapillary-Bilder erkannt wurden. Es werden Mapillary-Bilder bis ${mapillaryCoverageDateString} berücksichtigt. Diese Daten werden nur alle paar Monate aktualisiert.`,
}
