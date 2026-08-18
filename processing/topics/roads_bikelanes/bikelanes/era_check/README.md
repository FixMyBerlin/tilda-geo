# ERA-Check

Prüft Radverkehrsanlagen automatisiert gegen die **FGSV ERA 2010, Tabelle 5** („Breitenmaße von
Radverkehrsanlagen und Sicherheitstrennstreifen“). Aktuell nur die Breite; die Struktur ist darauf
angelegt, weitere Attribute additiv aufzunehmen.

| Datei                        | Aufgabe                                                                   |
| ---------------------------- | ------------------------------------------------------------------------- |
| `era_width_requirements.lua` | Tabelle 5 als Daten. Einzige Stelle mit Maßen.                            |
| `era_anlagentyp.lua`         | Kategorie, Verkehrsrichtung und Lage an der Straße → Zeile(n) der Tabelle |
| `era_width.lua`              | Markierungsaddition, Vergleich, Urteil                                    |
| `era_check.lua`              | Einstiegspunkt, liefert die `era_*`-Ergebnis-Tags                         |

Fachliche Beschreibung für Nutzer: [`topic-docs/roads_bikelanes/chapters/era-check.md`](../../../../../topic-docs/roads_bikelanes/chapters/era-check.md).

## Zwei Regeln, die den Rest erklären

**Bewertet wird nur, was erfasst ist.** Fehlende Angaben führen zu `unbekannt`, nie zu einem Mangel.
Ist der Anlagentyp nicht eindeutig, wird gegen alle in Frage kommenden Zeilen geprüft; ein Urteil
gibt es nur, wenn es für alle gleich ausfällt. `era_anlagentyp` nennt deshalb immer alle geprüften
Zeilen als Semikolon-Liste.

**Angenommenes wird als angenommen ausgewiesen.** Stammt die Verkehrsrichtung nicht aus einem
OSM-Tag, sondern aus `implicit_yes` / `assumed_no`, folgen wir ihr, setzen aber
`era_width_confidence = low` („vermutlich erfüllt“).

## Ausblick

**Kartenlayer ERA-Konformität.** `era_width_check` liegt als Attribut auf jeder Kante in den Tiles.
Ein Layer, der jede Radverkehrsanlage nach ihrer ERA-Konformität einfärbt, ist damit im Wesentlichen
eine Stilfrage: Die Style-Gruppen unter `app/src/components/regionen/pageRegionSlug/mapData/`
`mapDataSubcategories/mapboxStyles/groups/` werden aus Mapbox Studio generiert, es braucht also
einen Style dort plus eine Subcategory analog zu `subcat_bikelanes_plus_width_text`. Keine
Änderung am Processing.

**Zugriff auf zahlende Kunden begrenzen.** Der ERA-Check ist ein Mehrwert-Feature und soll nicht
öffentlich sichtbar sein. Vorgesehen: Auf der öffentlichen Seite wird die Bewertung unkenntlich
gemacht (Blur) und ist nur für zahlende Regionen/Accounts lesbar. Betrifft die Inspector-Zeile
(`TagsTableRowCompositEraWidth`) und einen späteren Kartenlayer; die Daten selbst bleiben in den
Tiles, die Sichtbarkeit wird in der App entschieden.
