import { mapillaryCoverageDateString } from '../../mapillaryCoverage.const'
import { CampaignType } from '../schema/campaignsSchema'

export const missing_traffic_sign_244__mapillary: CampaignType = {
  id: 'missing_traffic_sign_244__mapillary',
  title: 'Ergänze das Verkehrszeichen bei Fahrradstraßen (Mapillary)',
  pubDate: new Date('2024-05-28T15:00'),
  category: 'traffic_signs',
  recommendedAction: 'maproulette',
  visibility: 'promote',
  description: 'Diese Kampagne enthält Fahrradstraße ohne zugehörigen Verkehrszeichen-Tag.',
  task: '**Bitte ergänze fehlende Verkehrszeichen.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=1v92rco.4nyc.4pt3ls&v=2',
  maprouletteChallenge: {
    enabled: true,
    id: 52427,
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

Hinweis Mapillary: Diese Kampagne enthält nur Wege, für die Mapillary-Bilder erkannt wurden. Es werden Mapillary-Bilder bis ${mapillaryCoverageDateString} berücksichtigt. Diese Daten werden nur alle paar Monate aktualisiert.`,
}
