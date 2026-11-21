---
title: Zugang Radverkehr im Routing (`access_bicycle`)
---

`access_bicycle` auf `routing` sagt, ob Radfahren auf einer Kante erlaubt ist. Die Kanten sind auch dann im Graphen, wenn Radfahren dort nicht erlaubt ist. Ein Fahrrad-Router muss diese Kanten selbst herausfiltern.

## Auflösung

Der Wert kommt aus der OSM-Kette `bicycle`, sonst `vehicle`, sonst `access`. Es zählt der erste Tag, der gesetzt ist. `agricultural`, `forestry` und ihre Kombinationen werden zu `agricultural_or_forestry`. Veröffentlicht werden nur die Werte aus der Tabelle unten (`routable_bicycle_access` und `not_routable_bicycle_access` in `helper/sanitize_access_tags.lua`). Hat eine Kante einen anderen Wert (zum Beispiel `psv`, `emergency` oder `delivery;destination`), steht sie nicht im Graphen, weil ein leeres Feld „erlaubt“ bedeuten würde.

## Regel für Router

| `access_bicycle`                                                                                  | Radfahren     | Kante im Graphen                            |
| ------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------- |
| leer (kein Zugangs-Tag)                                                                           | erlaubt       | ja                                          |
| `yes`, `designated`, `permissive`, `use_sidepath`, `optional_sidepath`, `discouraged`, `dismount` | erlaubt       | ja                                          |
| `no`, `destination`, `private`, `customers`, `delivery`, `permit`, `agricultural_or_forestry`     | nicht erlaubt | nur zur Information, der Router filtert sie |

Die Liste der erlaubten Werte steht genau einmal im Code (`routable_bicycle_access` in `helper/sanitize_access_tags.lua`).

## Beispiele

- Anliegerstraße mit `vehicle=destination`: `access_bicycle=destination`.
- Fahrbahn mit `bicycle=no` neben einem Radweg: Die Fahrbahn hat `access_bicycle=no`, der Radweg hat seine eigene Kante.
- Weg mit `access=destination` und `bicycle=yes`: `access_bicycle=yes`.

## Radinfrastruktur an der Mittellinie

Radinfrastruktur, die an der Fahrbahn-Mittellinie gemappt ist (`side=left` oder `side=right`), hat ein leeres `access_bicycle`. Der Zugang der Fahrbahn (zum Beispiel `use_sidepath` oder `no`) gilt nicht für den Radweg selbst.

## Nicht in `routing`

- Wege mit `access`, `foot` (auf Fußwegen) oder `bicycle` (auf Radwegen) `private`, `delivery` oder `permit`, außer bei `bicycle=designated` (ausgeschilderter Radweg).
- Wege mit `service=*` außer `alley`, wenn sie keine eigene Radinfrastruktur haben.
- Wege mit dauerhaftem `access=no` (auf Fußwegen auch `foot=no`), außer Radfahren ist ausdrücklich erlaubt (`bicycle` oder `vehicle` mit einem Wert aus der ersten Zeile der Tabelle). `bicycle=no` auf einem Radweg schließt ihn immer aus.
- Fahrbahn- und Wege-Kanten von Wegen, die keine Zeile in `roads` / `roadsPathClasses` haben: `access=destination` oder `customers` ohne Erlaubnis für Radfahrende, `indoor=yes` und `informal=yes` ohne eigene Radinfrastruktur. Radinfrastruktur dieser Wege bleibt erhalten.
- Autobahnen und Schnellstraßen (`motorway`, `trunk`).

Die Gründe stehen in `helper/access_restriction.lua`.
