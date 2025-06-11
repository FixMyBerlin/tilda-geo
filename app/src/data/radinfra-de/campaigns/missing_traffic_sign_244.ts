import { CampaignType } from '../schema/campaignsSchema'

export const missing_traffic_sign_244: CampaignType = {
  id: 'missing_traffic_sign_244',
  title: 'Ergänze das Verkehrszeichen bei Fahrradstraßen',
  pubDate: new Date('2024-09-20T15:00'),
  category: 'traffic_signs',
  recommendedAction: 'maproulette',
  visibility: 'hidden',
  description: 'Diese Kampagne enthält Fahrradstraße ohne zugehörigen Verkehrszeichen-Tag.',
  task: '**Bitte ergänze fehlende Verkehrszeichen.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=v92cax.hrb610.3dc&v=2',
  maprouletteChallenge: {
    enabled: true,
    id: 49357,
    checkinComment: 'Verkehrszeichen an Fahrradstraße ergänzt.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
  },
  taskTemplate: `
Dieser Weg ist als Fahrradstraße getaggt, **jedoch fehlt der zugehörige Verkehrszeichen-Tag.**

## Aufgabe

Bitte ergänze das Verkehrszeichen an der Straßenlinie:

* \`traffic_sign=DE:244.1\`, wenn es eine "echte" Fahrradstraße ohne Kfz-Verkehr.
* \`traffic_sign=DE:244.1,1020-30\`, wenn es Fahrradstraße mit "Anlieger Frei" ist.

Ergänze gerne auch einen \`mapillary=*\` Tag auf dem das Verkehrszeichen zu sehen ist.

Andere Zusatzzeichen kannst du beispielsweise [im Verkehrszeichen-Tool](https://trafficsigns.osm-verkehrswende.org/?signs=DE:244.1) oder [im Wiki](https://wiki.openstreetmap.org/wiki/DE:Tag:bicycle_road%3Dyes#Zusatzzeichen) finden.

Wenn wirklich kein Verkehrszeichen existiert, tagge \`traffic_sign=none\`, um diese Information explizit zu erfassen.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)
`,
}
