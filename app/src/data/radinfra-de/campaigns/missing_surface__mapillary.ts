import { mapillaryCoverageDateString } from '../../mapillaryCoverage.const'
import { CampaignType } from '../schema/campaignsSchema'

export const missing_surface__mapillary: CampaignType = {
  id: 'missing_surface__mapillary',
  title: 'Ergänze Angaben zur Oberfläche (Mapillary)',
  pubDate: new Date('2025-05-28T15:00'),
  category: 'surface',
  recommendedAction: 'maproulette',
  visibility: 'secondary',
  description: 'Diese Karte zeigt Wege, bei denen die Angabe zur Oberfläche fehlt.',
  task: '**Bitte ergänze die Oberfläche / den Belag `surface` und gerne auch die Oberflächenqualität `smoothness`.**',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=ife2uk.k0cbo.f6&v=2', // TODO
  maprouletteChallenge: {
    enabled: true,
    // id: ,
    checkinComment: 'Angabe zu Oberflächenqualität ergänzt.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
  },
  taskTemplate: `
Diesem Weg fehlt eine Angabe zur Oberfläche/Belag.

## Aufgabe

**Bitte ergänze die Angabe zur Oberfläche** und gerne auch zur Oberflächenqualität.**

* Nutze \`surface\` um die Oberfläche zu beschreiben. [Zum Wiki](https://wiki.openstreetmap.org/wiki/DE:Key:surface)
* Nutze \`smoothness\` um die Oberflächenqualität zu beschreiben. Dieser Wert ist subjektiver, bitte orientiere dich an den [Beispielen im Wiki](https://wiki.openstreetmap.org/wiki/DE:Key:smoothness) und [in dieser Gallerie](https://wiki.openstreetmap.org/wiki/Key:smoothness/Gallery).

Tipp: Android Nutzer:innen empfehlen wir [StreetComplete](https://streetcomplete.app/). Dort findet du gute Beispielbilder, was die Erfassung vereinfacht.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)

Hinweis Mapillary: Diese Kampagne enthält nur Wege, für die Mapillary-Bilder erkannt wurden. Es werden Mapillary-Bilder bis ${mapillaryCoverageDateString} berücksichtigt. Diese Daten werden nur alle paar Monate aktualisiert.`,
}
