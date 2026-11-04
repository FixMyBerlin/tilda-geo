import type { CampaignType } from '../schema/campaignsSchema'

export const deprecated_cycleway_shared: CampaignType = {
  id: 'deprecated_cycleway_shared',
  title: 'Veraltetes Tagging `shared`',
  pubDate: new Date('2025-01-01T15:00'),
  category: 'radinfra',
  recommendedAction: 'maproulette',
  visibility: 'secondary',
  description: 'Diese Kampagne enthält Wege, die die veraltete Angabe `cycleway=shared` verwenden.',
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
Dieser Weg hat den veralteten Tag \`cycleway=shared\`. Diese wollen wir aktualisieren.

## Aufgabe

**Bitte prüfe die Infrastruktur und aktualisiere das Tagging.**

* Lösche in jedem Fall \`cycleway=shared\`. Erst dann ist die Aufgabe erledigt.
* Hat der Weg schon \`cycleway:both\`, \`cycleway:left\` oder \`cycleway:right\`? Dann reicht das Löschen.
* Gibt es Piktogrammketten (Sharrows) auf der Fahrbahn? Dann ersetze es durch \`cycleway:both=shared_lane\`.
* Wenn keine Radinfrastruktur vorliegt, ersetze es durch \`cycleway:both=no\`.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)
`,
}
