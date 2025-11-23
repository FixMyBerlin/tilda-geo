import { mapillaryCoverageDateString } from '../../mapillaryCoverage.const'
import { CampaignType } from '../schema/campaignsSchema'

export const missing_traffic_sign__mapillary: CampaignType = {
  id: 'missing_traffic_sign__mapillary',
  title: 'Ergänze das Verkehrszeichen der Radinfrastruktur (Mapillary)',
  pubDate: new Date('2025-05-28T15:00'),
  category: 'traffic_signs',
  recommendedAction: 'map',
  visibility: 'secondary',
  description: 'Diese Karte enthält Radinfrastruktur der ein Verkehrszeichen-Tag fehlt.',
  task: '**Bitte ergänze fehlende Verkehrszeichen oder ein explizites `traffic_sign=none`.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=1v92rco.4nyc.4pt3j4&v=2',
  maprouletteChallenge: {
    enabled: true,
    id: 52426,
    checkinComment: 'Verkehrszeichen ergänzt.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
  },
  taskTemplate: `
Für diese Infrastruktur ist kein Verkehrszeichen-Tag hinterlegt. Gerade für Fuß- und Fahrrad-Infrastruktur ist es sehr hilfreich, das Verkehrszeichen explizit zu erfassen.

## Aufgabe

**Bitte ergänze das Verkehrszeichen am Weg.**

1. Prüfe mit Mapillary (s.u.) oder vor Ort, welches Verkehrszeichen vorliegt.
   Ideal ist, wenn du über den \`mapillary=*\` Tag den Mapillary-Key von einem Foto hinterlegst, auf dem das Verkehrszeichen zu sehen ist.

2. Nutze beispielsweise [das Verkehrszeichen-Tool](https://trafficsigns.osm-verkehrswende.org/) umd Tagging-Empfehlungen zu erhalten und ergänze den \`traffic_sign=*\` Tag.

3. Wenn kein Verkehrszeichen existiert, tagge \`traffic_sign=none\`, um diese Information explizit zu erfassen. Das hilft bei zukünftigen Auswertungen.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)

Hinweis Mapillary: Diese Kampagne enthält nur Wege, für die Mapillary-Bilder erkannt wurden. Es werden Mapillary-Bilder bis ${mapillaryCoverageDateString} berücksichtigt. Diese Daten werden nur alle paar Monate aktualisiert.`,
}
