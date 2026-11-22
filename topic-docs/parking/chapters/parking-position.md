---
title: Parkposition und rechtliche Graubereiche
---

Das Attribut `parking` beschreibt Lage oder Art des Parkraums im Straßenland. Die Zuordnung erfolgt in OpenStreetMap und wird von der Prozessierung übernommen – sie wird nicht automatisch aus der Geometrie abgeleitet.

## Grundsatz: Rechtliche Zulässigkeit

Der Datensatz orientiert sich an der rechtlichen Zulässigkeit des Parkens, nicht allein am beobachteten Parkverhalten. Situationen im rechtlichen Graubereich können erfasst werden; eindeutig ordnungswidriges Parken wird nicht als regulärer Parkraum geführt (siehe Tabelle „Kein Parken“).

## `parking=lane` – Parken auf der Fahrbahn

Für Parken auf der Fahrbahn muss neben parkenden Fahrzeugen eine Restfahrbahnbreite von mindestens 3,05 m verbleiben. Bei einer mittleren Fahrzeugbreite von ca. 2 m ergibt sich als Faustregel für die Tagging-Entscheidung:

- ab ca. **5 m** Fahrbahnbreite: einseitiges Fahrbahnparken möglich
- ab ca. **7 m** Fahrbahnbreite: beidseitiges Fahrbahnparken möglich

`road_width` kann aus OSM-Tags oder Standardwerten je Straßentyp stammen (`road_width_source`).

## `parking=shoulder` – Parken auf dem Seitenstreifen

Laut StVO ist Parken auf Seitenstreifen nur auf ausreichend befestigten Streifen zulässig. In randstädtischen Bereichen ohne baulich angelegte Gehwege ist es üblich, neben der Fahrbahn auf nicht dafür vorgesehenen, aber durch Nutzung verfestigten Randbereichen zu parken.

Diese Situationen werden als Graubereich behandelt:

- `parking=shoulder` für die Lage auf dem Seitenstreifen bzw. Randbereich
- `informal=yes` für geduldetes Parken im rechtlichen Graubereich

**Nicht erfasst** wird Parken auf grasbewachsenen Flächen (`surface=grass` o. ä.) – das gilt als ordnungswidrig und erscheint nicht im regulären Parkraum-Layer.

## Alternierendes Parken (`staggered=yes`)

Lässt die Fahrbahnbreite einseitiges, aber nicht beidseitiges Fahrbahnparken zu, kann sich örtlich die Praxis versetzten Parkens entwickeln: Fahrzeuge parken abwechselnd auf der einen oder anderen Seite.

In diesen Fällen werden Geometrien auf beiden Straßenseiten geführt, aber:

- `staggered=yes` kennzeichnet die Parkweise
- die Kapazität wird reduziert (siehe Kapitel „Berechnung der Kapazität“)

## Weitere Parkpositionen

| Wert                       | Bedeutung                            |
| -------------------------- | ------------------------------------ |
| `half_on_kerb` / `on_kerb` | Teilweise bzw. ganz auf dem Gehweg   |
| `street_side`              | Parkbucht                            |
| `separate`                 | Separat als eigene Geometrie erfasst |
| `yes`                      | Straßenparken ohne nähere Bestimmung |

## Abgrenzung zu „Kein Parken“

Folgende Situationen werden nicht als regulärer Parkraum geführt (Layer „Kein Parken“, `reason`):

- Parken außerhalb markierter Stellplätze in verkehrsberuhigten Bereichen
- nicht angeordnetes Parken auf Gehwegen oder erhöhten Bordsteinen
- zu schmale Fahrbahn (`reason=narrow`)
- explizite Verbote (`restriction_no_parking`, `restriction_no_stopping`, …)

Eingeschränkte Haltverbote (`no_parking` / `no_standing`) sind im Nicht-Parken-Layer erfasst, nicht im regulären Parkraum.
