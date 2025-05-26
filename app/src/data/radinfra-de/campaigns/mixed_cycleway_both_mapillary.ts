import { CampaignType } from '../schema/campaignsSchema'

export const mixed_cycleway_both_mapillary: CampaignType = {
  id: 'mixed_cycleway_both_mapillary',
  todoKey: 'mixed_cycleway_both',
  title: 'Überschneidende Tags (`cycleway*`) (Mapillary)',
  pubDate: new Date('2025-05-26T15:00'),
  category: 'radinfra',
  recommendedAction: 'maproulette',
  visibility: 'secondary',
  description:
    'Dieser Weg hat Tags die sich überschneiden: `cycleway` (Angabe für beide Seiten) in Kombination mit `cycleway:left|right` (Angabe für eine bestimmte Seite). Zudem sind nur Wege enthalten, für die Mapillary-Straßenfotos verfügbar sind.',
  task: '**Bitte kontrolliere die Angaben und ändere sie, so dass sie eindeutig sind.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=v92cax.2j1vo.3dc&v=2',
  maprouletteChallenge: {
    enabled: true,
    // id: ,
    checkinComment: 'Überschneidende Tags präzisiert.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
    filterMapillary: 'pano_regular',
  },
  taskTemplate: `
Dieser Weg hat Tags die sich überschneiden:
* sowohl eine Angabe \`cycleway\` oder \`cycleway:both\` (Tags für beide Seiten)
* als auch eine Angabe für eine Seite (z.B. \`cycleway:right\`)

Diese Überschneidung erschwert die Datenverarbeitung und kann zu falschen Ergebnissen führen.

## Aufgabe

**Bitte kontrolliere die Angaben und ändere sie, so dass sie eindeutig sind.**

* Wenn auf beiden Straßenseiten Radinfrastruktur vorhanden ist, wählen \`cycleway:both\` und lösche die Angaben zur Seite.
* Wenn nur auf einer Straßenseite Radinfrastruktur vorhanden ist, _lösche_ die Angabe \`cycleway:both\` bzw. \`cycleway\`. Jede Seite sollte dann einen Wert oder ein \`no\` haben.

In wenigen fällen kommt ein Tagging wie \`cycleway=left\` vor. Das ist ein Tagging-Fehler und kann – nach Kontrolle – zu Gunsten [des üblichen Taggings](https://wiki.openstreetmap.org/wiki/DE:Bicycle/Radverkehrsanlagen_kartieren#Stra%C3%9Fenbegleitende_Wege) gelöscht werden.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)
`,
}
