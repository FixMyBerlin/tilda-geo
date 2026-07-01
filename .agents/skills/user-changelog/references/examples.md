# Examples: German changelog wording

All bullets below are **target output** (German). Annotations are English.

## Commit subject → user bullet

| Commit subject (internal)                                                                                 | User bullet (German — write like this)                                                                                            |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `fix(map): clamp viewport on region change`                                                               | **Karte:** Beim Wechsel der Region zoomt die Karte automatisch auf den passenden Ausschnitt.                                      |
| `feat(export): include custom properties in GeoJSON`                                                      | **Export:** Heruntergeladene GeoJSON-Dateien enthalten wieder alle Eigenschaften der Objekte.                                     |
| `chore: bump maplibre to 5.2`                                                                             | _(omit — no visible change)_                                                                                                      |
| `fix(auth): clear session cookie on logout`                                                               | Behoben: Nach dem Abmelden wurden noch Daten der vorherigen Sitzung angezeigt.                                                    |
| `refactor: extract region loader`                                                                         | _(omit)_                                                                                                                          |
| `fix: tooltip position on iPad`                                                                           | **Karte:** Hinweise an Kartenobjekten erscheinen auf dem iPad wieder an der richtigen Stelle.                                     |
| `feat(list): add column drag handles` + `feat(list): persist column order in URL` _(one feature — merge)_ | **Listenansicht:** Spalten lassen sich per Drag & Drop sortieren; die gewählte Reihenfolge bleibt beim Teilen des Links erhalten. |
| `feat(processing): refresh bike lane dataset`                                                             | **Processing:** Radwege-Daten wurden auf den aktuellen OSM-Stand aktualisiert.                                                    |

## Good vs bad bullets

**Good (German)**

- Die Suche berücksichtigt jetzt Umlaute (ä, ö, ü).
- **Listenansicht:** Spalten lassen sich per Drag & Drop sortieren.
- Behoben: Der Druckdialog schneidet die Kartenlegende nicht mehr ab.

**Bad**

- Refactored RegionLoader to use TanStack Query. _(technical, no user benefit)_
- Updated dependencies. _(irrelevant)_
- Fixed bug in `useRegionBounds`. _(code jargon)_
- PR #4521 merged. _(process, not product)_

## Empty period

```markdown
## Zusammenfassung von `a1b2c3d` bis `e4f5g6h` (2025-07-07)

- Keine nutzerrelevanten Änderungen in diesem Zeitraum.
```

## Merge several commits into one bullet

Three commits (`fix tooltip`, `fix tooltip offset`, `ipad touch target`) → one bullet:

- **Karte:** Hinweise und Schaltflächen auf dem iPad sind leichter zu bedienen; Position der Hinweise korrigiert.
