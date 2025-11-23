import { mapillaryCoverageDateString } from '../../mapillaryCoverage.const'
import { CampaignType } from '../schema/campaignsSchema'

export const missing_traffic_sign_vehicle_destination__mapillary: CampaignType = {
  id: 'missing_traffic_sign_vehicle_destination__mapillary',
  title: 'Ergänze das Verkehrszeichen »Anlieger frei« (Mapillary)',
  pubDate: new Date('2024-05-28T15:00'),
  category: 'traffic_signs',
  recommendedAction: 'maproulette',
  visibility: 'secondary',
  description:
    'Diese Kampagne enthält Fahrradstraßen mit der Freigabe »Anlieger frei« für Kfz. Es fehlt jedoch das zugehörige Zusatzzeichen.',
  task: '**Bitte ergänze fehlende Verkehrszeichen oder korrigiere den Zugangs-Tag`.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=1v92rco.4nyc.4pt3wg&v=2',
  maprouletteChallenge: {
    enabled: true,
    id: 52428,
    checkinComment: 'Verkehrszeichen und access-Tagging vereinheitlicht.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
  },
  taskTemplate: `
Dieser Weg ist als Fahrradstraße mit Freigabe für Kfz getaggt, **jedoch fehlt der zugehörige Verkehrszeichen-Tag (Zusatzzeichen).**

## Aufgabe

Bitte ergänze oder erweitere das Verkehrszeichen an der Straßenlinie:

* \`traffic_sign=DE:244.1,1020-30\`, wenn es Fahrradstraße mit "Anlieger Frei" ist. Dazu gehört dann für Fahrzeuge \`destination\`.
* \`traffic_sign=DE:244.1\`, wenn es eine "echte" Fahrradstraße ohne Kfz-Verkehr ist. Dazu gehört dann für Fahrzeuge \`no\`.
* Andere Zusatzzeichen kannst du beispielsweise [im Verkehrszeichen-Tool](https://trafficsigns.osm-verkehrswende.org/?signs=DE:244.1) oder [im Wiki](https://wiki.openstreetmap.org/wiki/DE:Tag:bicycle_road%3Dyes#Zusatzzeichen) finden.

Wenn wirklich kein Verkehrszeichen existiert, tagge \`traffic_sign=none\`, um diese Information explizit zu erfassen.

Ergänze gerne auch einen \`mapillary=*\` Tag auf dem das Verkehrszeichen zu sehen ist.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)

Wenn keine Änderung nötig ist, ergänze gerne einen \`check_date=*\` Tag um zu signalisieren, dass alle Tags geprüft wurden und aktuell sind. Das hilft bei der Auswertung.

Hinweis Mapillary: Diese Kampagne enthält nur Wege, für die Mapillary-Bilder erkannt wurden. Es werden Mapillary-Bilder bis ${mapillaryCoverageDateString} berücksichtigt. Diese Daten werden nur alle paar Monate aktualisiert.`,
}
