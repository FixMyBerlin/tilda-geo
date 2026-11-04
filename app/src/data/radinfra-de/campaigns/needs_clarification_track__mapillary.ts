import type { CampaignType } from '../schema/campaignsSchema'

export const needs_clarification_track__mapillary: CampaignType = {
  id: 'needs_clarification_track__mapillary',
  title: 'Führungsform `track` unklar (Mapillary)',
  pubDate: new Date('2025-05-28T10:00'),
  category: 'radinfra',
  recommendedAction: 'maproulette',
  visibility: 'secondary',
  description:
    'Diese Wege sind als `cycleway=track` eingetragen. Es fehlen ihnen aber Attribute, um eine eindeutige Radinfrastruktur-Kategorie zu vergeben.',
  task: '**Bitte ergänze weitere Tags, um eine präzise Kategorisierung sicherzustellen.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=1v92rco.4nyc.4pvwn4&v=2',
  maprouletteChallenge: {
    enabled: true,
    id: 52433,
    checkinComment: 'Angabe zur Führungsform ergänzt.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
  },
  taskTemplate: `
Dieser Weg ist als \`cycleway=track\` eingetragen. Das sind nicht genug Daten, um eine eindeutige Radinfrastruktur-Kategorie zu vergeben.

## Aufgabe

**Bitte prüfe die Infrastruktur und aktualisiere das Tagging.**

_Wenn du so wenig wie möglich ändern möchtest:_

Die Aufgabe gilt für eine Straßenseite. Ergänze die Tags für diese Seite mit \`cycleway:left:*\` oder \`cycleway:right:*\` (links/rechts in Zeichenrichtung der Straße). Ist es auf beiden Seiten gleich, nutze \`cycleway:both:*\`. Ein vorhandenes \`cycleway:both=track\` kann bleiben, die Ergänzungen dürfen je Seite verschieden sein.

* Ergänze das [passende Verkehrszeichen](https://trafficsigns.osm-verkehrswende.org/DE), z. B. \`cycleway:right:traffic_sign=DE:237\` (Radweg), \`DE:240\` (gemeinsamer Geh- und Radweg) oder \`DE:241-30\` (getrennter Rad- und Gehweg).
* Ist der Weg unbeschildert (\`cycleway:right:traffic_sign=none\`), ergänze zusätzlich \`cycleway:right:segregated=yes\`, wenn Rad- und Fußverkehr baulich getrennt sind, bzw. \`no\` bei einer gemeinsamen Fläche.
* Gerne auch: Wenn der Radweg in beide Richtungen befahren werden darf, ergänze \`cycleway:right:oneway=no\`.

_Wenn du dir zutraust die Geometrie umzuwandeln:_ In vielen Fällen bietet es sich an, den Weg als separate Geometrie parallel zur Straße einzutragen:

* [Das Wiki gibt gute Hilfestellung](https://wiki.openstreetmap.org/wiki/DE:Bicycle/Radverkehrsanlagen_kartieren#Stra%C3%9Fenbegleitende_Wege).
* [Das Verkehrszeichen-Tool](https://trafficsigns.osm-verkehrswende.org/DE) hilft, den Weg mit passenden Attributen auszustatten.
* Bitte ergänze \`is_sidepath=yes\` um den Weg als straßenbegleitend zu attributieren.
* Bitte ergänze \`oneway=yes|no\` für die Richtungsfreigabe.
* Und ändere die Tags an der Straße, die auf den neuen Weg verweisen von \`track\` auf \`separate\` (siehe Wiki).
* Kreuzt der neue Weg andere Wege? Hier bitte den Übergang passend eintragen.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)

Hinweis Mapillary: Diese Kampagne enthält nur Wege, für die Mapillary-Bilder erkannt wurden. Der Abgleich mit Mapillary findet nur alle paar Wochen statt. [Datum der letzten Aktualisierung anzeigen](https://tilda-geo.de/docs/mapillary-coverage).`,
}
