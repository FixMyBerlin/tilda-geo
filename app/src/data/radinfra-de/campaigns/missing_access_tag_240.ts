import { CampaignType } from '../schema/campaignsSchema'

export const missing_access_tag_240: CampaignType = {
  id: 'missing_access_tag_240',
  todoKey: 'missing_access_tag_240',
  title: 'Fehlende Zugangs-Tags bei Geh- & Radwege',
  pubDate: new Date('2025-01-01T15:00'),
  category: 'traffic_signs',
  recommendedAction: 'maproulette',
  visibility: 'secondary',
  description:
    'Diese Kampagne enthält Geh- & Radwege bei denen die Zugangs-Tags fehlen. Es sind Wege mit Verkehrszeichen `240` (Gem. Geh- und Radweg) oder `241` (Getr. Rad- und Gehweg).',
  task: '**Bitte prüfe die Radinfrastruktur und ergänze die Zugangs-Tags.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=ife2uk.ce2s.f6&v=2',
  maprouletteChallenge: {
    enabled: true,
    id: 50890,
    checkinComment: 'Access-Tags ergänzt.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
  },
  taskTemplate: `
Für diesen Weg wurde das Verkehrszeichen \`240\` oder \`241\` angegeben aber ein entsprechendes Zugangs-Taggging fehlt.

## Aufgabe

Bitte prüfe die Infrastruktur und ergänze:

* \`bicycle=designated\` und \`foot=designated\`
* Empfehlungen für [\`240\` Gem. Geh- und Radweg](https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:240)
* Empfehlungen für [\`241\` Getr. Rad- und Gehweg](https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:241-30)

Ergänze gerne auch einen \`mapillary=*\` Tag auf dem das Verkehrszeichen zu sehen ist.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)
`,
}
