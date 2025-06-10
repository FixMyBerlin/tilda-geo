import { mapillaryCoverageDateString } from '../../mapillaryCoverage.const'
import { CampaignType } from '../schema/campaignsSchema'

export const needs_clarification_track__mapillary: CampaignType = {
  id: 'needs_clarification_track__mapillary',
  title: 'Führungsform `track` unklar (Mapillary)',
  pubDate: new Date('2025-05-28T10:00'),
  category: 'radinfra',
  recommendedAction: 'maproulette',
  visibility: 'secondary',
  description:
    'Diesee Wege sind als `cycleway=track` eingetragen. Es fehlen ihnen aber Attribute, um eine eindeutige Radinfrastruktur-Kategorie zu vergeben.',
  task: '**Bitte ergänze weitere Tags, um eine präzise Kategorisierung sicherzustellen.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=pdqyyt.4nyd.16j30g&v=2',
  maprouletteChallenge: {
    enabled: true,
    // id: ,
    checkinComment: 'Angabe zur Führungsform ergänzt.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
  },
  taskTemplate: `
Dieser Weg ist als \`cycleway=track\` eingetragen. Das sind nicht genug Daten, um eine eindeutige Radinfrastruktur-Kategorie zu vergeben.

## Aufgabe

**Bitte prüfe die Infrastruktur und aktualisiere das Tagging.**

_Wenn du so wenig wie möglich ändern möchtest:_

* Ergänze \`cycleway:right:segregated=yes\`, wenn Rad- und Fußverkehr getrennt sind — bzw. \`no\` bei einem gem. Geh-Radweg.
* Ergänze \`cycleway:right:traffic_sign=*\`, mit dem [passenden Verkehrszeichen](https://trafficsigns.osm-verkehrswende.org/DE) — oder \`none\` wenn unbeschildert.
* Wenn der Radweg in beide Richtunge befahren werden darf, ergänze \`cycleway:right:oneway=no\`.

(Das gleiche gilt auch für \`cycleway:right:*\` bzw. \`cycleway:both:*\`.)

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

Hinweis Mapillary: Diese Kampagne enthält nur Wege, für die Mapillary-Bilder erkannt wurden. Es werden Mapillary-Bilder bis ${mapillaryCoverageDateString} berücksichtigt. Diese Daten werden nur alle paar Monate aktualisiert.`,
}
