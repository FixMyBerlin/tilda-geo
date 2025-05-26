import { CampaignType } from '../schema/campaignsSchema'

export const missing_access_tag_bicycle_road: CampaignType = {
  id: 'missing_access_tag_bicycle_road',
  todoKey: 'missing_access_tag_bicycle_road',
  title: 'Fehlender Zugangs-Tag bei Fahrradstraßen',
  pubDate: new Date('2024-10-01T15:00'),
  category: 'traffic_signs',
  recommendedAction: 'maproulette',
  visibility: 'secondary',
  description: 'Diese Kampagne enthält Fahrradstraße bei denen der Zugangs-Tag fehlt.',
  task: '**Bitte prüfe die Situation und ergänze den fehlenden Zugangs-Tag `bicycle=designated`.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=ife2uk.nmmc.f6&v=2',
  maprouletteChallenge: {
    enabled: true,
    id: 49368,
    checkinComment: 'bicycle=designated an Fahrradstraßen ergänzt.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
  },
  taskTemplate: `
Dieser Weg ist als Fahrradstraße getaggt **ohne das zugehörige \`bicycle=designated\`.** Ohne diesen Zusatz können Router nicht erkennen, dass die Straße für den Radverkehr freigegeben ist.

## Aufgabe

Bitte ergänze den Access-Tag \`bicycle=designated\` an der Straßenlinie:

Nutze gerne die Gelegenheit, um auch die übrigen Tags der Fahrradstraße zu prüfen. Hinweise zum Tagging geben [das Verkehrszeichen-Tool](https://trafficsigns.osm-verkehrswende.org/?signs=DE:244.1) und [das Wiki](https://wiki.openstreetmap.org/wiki/DE:Tag:bicycle_road%3Dyes#Zusatzzeichen).

Ergänze gerne auch einen \`mapillary=*\` Tag auf dem das Verkehrszeichen zu sehen ist.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)


Wenn keine Änderung nötig ist, ergänze gerne einen \`check_date=*\` Tag um zu signalisieren, dass alle Tags geprüft wurden und aktuell sind. Das hilft bei der Auswertung.
`,
}
