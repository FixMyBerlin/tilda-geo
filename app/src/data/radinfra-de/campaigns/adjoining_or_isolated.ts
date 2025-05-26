import { CampaignType } from '../schema/campaignsSchema'

export const adjoining_or_isolated: CampaignType = {
  id: 'adjoining_or_isolated',
  todoKey: 'adjoining_or_isolated',
  title: 'Straßenbegleitend oder selbstständig geführt?',
  pubDate: new Date('2025-01-01T15:00'),
  category: 'radinfra',
  recommendedAction: 'maproulette',
  visibility: 'secondary',
  description:
    'Diese Kampagne enthält Wege, deren Führungsform [in TILDA Radverkehr](https://tilda-geo.de/regionen/radinfra?config=ife2uk.3yo4.f6&v=2) nicht präzise angegeben werden kann. (Aktuell werden nur Wege der Kategorie "Radweg" aufgenommen.)',
  task: '**Bitte prüfe ob die Radinfrastruktur straßenbegleitend ist und ergänze den fehlenden Zugangs-Tag `is_sidepath=yes` oder `no`.** Weitere Hinweise findet Du in der Aufgabenbeschreibung.\n',
  mapUrl: 'https://tilda-geo.de/regionen/radinfra?config=ife2uk.3yo4.f6&v=2',
  maprouletteChallenge: {
    enabled: true,
    id: 50885,
    checkinComment:
      'Angabe zur Führung der Fahrradinfrastruktur (straßenbegleitend bzw. selbstständig geführt) ergänzt.',
    checkinSource: 'radinfra_de',
    resultsLimited: false,
  },
  taskTemplate: `
Für diese Infrastruktur (%%CATEGORY%%) fehlt uns eine Angabe, ob sie straßenbegleitend ist (oder nicht).

## Aufgabe

Bitte präzisiere das Tagging.
* Ist die Infrastruktur ein Radweg oder geteilter/gemeinsamer Geh- und Radweg? Dann ergänze bitte \`is_sidepath=yes\`, wenn der Weg straßenbegleitend ist oder \`is_sidepath=no\` für selbständig/frei geführt Wege.
* Ist die Infrastruktur ein Gehweg? Dann wähle "Gehweg" als Typ aus oder füge \`footway=sidepath\` hinzu.

## Hilfsmittel

* [Mapillary-Link vom Anfang der Straße](%%MAPILLARY_URL_START%%)
* [Mapillary-Link vom Ende der Straße](%%MAPILLARY_URL_END%%)
* [TILDA Radverkehr an dieser Stelle](%%ATLAS_URL%%)
* [OpenStreetMap](%%OSM_URL%%)
`,
}
