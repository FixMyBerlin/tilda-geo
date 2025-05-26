import { CampaignType } from '../schema/campaignsSchema'

export const missing_width_mapillary: CampaignType = {
  id: 'missing_width_mapillary',
  todoKey: 'missing_width_surface_sett',
  title: 'Ergänze Angaben zur Breite (Mapillary)',
  pubDate: new Date('2025-05-26T15:00'),
  category: 'width',
  recommendedAction: 'streetcomplete',
  visibility: 'secondary',
  description:
    'Diese Karte zeigt Wege, bei denen die Angabe zur Breite der Radinfrastruktur fehlt und die Oberfläche Pflastersteine sind.',
  task: '**Bitte ergänze die Breite der Radinfrastruktur `width`.** Häufig kann man dafür die Pflastersteine zählen um die Breite zu ermitteln.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=ife2uk.8vo5z8.f6&v=2',
  maprouletteChallenge: {
    enabled: true,
    // id: ,
    checkinComment: 'Angabe zur Breite ergänzt.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
    filterMapillary: 'pano_regular',
  },
  taskTemplate: `
Diesem Weg fehlt eine Angabe zur Breite.

## Aufgabe

**Bitte ergänze die Breitenangabe.**

* Zähle die Pflastersteine und berechne daraus die Breite in Meter.
* Nutze \`width\` für die Breite (beispielweise \`2.5\`)
* Nutze \`source:width=7,5 Steine à 20 cm\` um die Rechnung zu dokumentieren.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)
`,
}
