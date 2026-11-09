import type { CampaignType } from '../schema/campaignsSchema'

export const deprecated_cycleway_shared: CampaignType = {
  id: 'deprecated_cycleway_shared',
  title: 'Veraltetes Tagging `shared`',
  pubDate: new Date('2025-01-01T15:00'),
  category: 'radinfra',
  recommendedAction: 'maproulette',
  visibility: 'secondary',
  description:
    'Diese Kampagne enthält Wege, die die veraltete Angabe `cycleway=shared` verwenden, auch für eine Seite (`cycleway:both=shared`, `cycleway:left=shared`, `cycleway:right=shared`).',
  task: '**Bitte ändere das Tagging. In vielen Fällen kann es ersatzlos gestrichen werden. Es ist aber wichtig, die Infrastruktur in diesem Zuge zu prüfen.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=ife2uk.hrb610.f6&v=2',
  maprouletteChallenge: {
    enabled: true,
    id: 50889,
    checkinComment: 'Deprecated cycleway=shared.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
  },
  taskTemplate: `
Dieser Weg hat den veralteten Tag \`cycleway=shared\` (oder \`cycleway:both=shared\`, \`cycleway:left=shared\`, \`cycleway:right=shared\`). Diese wollen wir aktualisieren.

## Aufgabe

**Bitte prüfe die Infrastruktur und aktualisiere das Tagging.**

* Entferne in jedem Fall den Wert \`shared\`. Erst dann ist die Aufgabe erledigt.
* Steht \`cycleway=shared\` und hat der Weg schon \`cycleway:both\`, \`cycleway:left\` oder \`cycleway:right\`? Dann reicht das Löschen.
* Gibt es Piktogrammketten (Sharrows) auf der Fahrbahn? Dann ersetze es durch \`shared_lane\` auf der Seite (\`cycleway:both=shared_lane\`, \`cycleway:right=shared_lane\`, …).
* Wenn keine Radinfrastruktur vorliegt, ersetze es durch \`no\` auf der Seite (\`cycleway:both=no\`, …).

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)
`,
}
