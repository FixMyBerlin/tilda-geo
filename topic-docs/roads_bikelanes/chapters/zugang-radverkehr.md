---
title: Zugang Radverkehr im Routing (`access_bicycle`)
---

`access_bicycle` auf `routing` sagt, ob Radfahren auf einer Kante erlaubt ist. Die Kanten sind auch dann im Graphen, wenn Radfahren dort nicht erlaubt ist. Ein Fahrrad-Router muss diese Kanten selbst herausfiltern.

## Auflösung

Der Wert kommt aus der OSM-Kette `bicycle`, sonst `vehicle`, sonst `access`. Es zählt der erste Tag, der gesetzt ist. `agricultural`, `forestry` und ihre Kombinationen werden zu `agricultural_or_forestry`. Veröffentlicht werden nur die Werte aus der Tabelle unten (`routable_bicycle_access` und `not_routable_bicycle_access` in `helper/sanitize_access_tags.lua`). Hat eine Kante einen anderen Wert (zum Beispiel `psv`, `emergency` oder `delivery;destination`), steht sie nicht im Graphen, weil ein leeres Feld „erlaubt“ bedeuten würde.

Vorher liest TILDA drei Werte um, auf allen Zugangs-Keys: `unknown` zählt wie kein Tag, `military` wie `no`, `residents` wie `private`.

Ob ein Weg überhaupt in den Daten steht, entscheidet nur `access` (gilt auch für Fußgänger), auf Fußwegen zusätzlich `foot` und auf Radwegen `bicycle`. `vehicle`, `motor_vehicle` und `bicycle` auf anderen Wegen nehmen keinen Weg heraus. Sie landen nur in `access_bicycle`. Ein Weg mit `access=private` fehlt also, ein Weg mit `vehicle=private` bleibt mit `access_bicycle=private` im Graphen.

## Regel für Router

| `access_bicycle`                                                                                  | Radfahren     | Kante im Graphen                            |
| ------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------- |
| leer (kein Zugangs-Tag)                                                                           | erlaubt       | ja                                          |
| `yes`, `designated`, `permissive`, `use_sidepath`, `optional_sidepath`, `discouraged`, `dismount` | erlaubt       | ja                                          |
| `no`, `destination`, `private`, `customers`, `delivery`, `permit`, `agricultural_or_forestry`     | nicht erlaubt | nur zur Information, der Router filtert sie |

`use_sidepath` und `optional_sidepath` zählen als erlaubt: Sie stehen auf der Fahrbahn und verweisen auf einen Radweg daneben. Ein Router sollte diesen Radweg bevorzugen, bei `use_sidepath` ist er benutzungspflichtig.

Die Liste der erlaubten Werte steht in `routable_bicycle_access` in `helper/sanitize_access_tags.lua`.

## Beispiele

- Anliegerstraße mit `vehicle=destination`: `access_bicycle=destination`.
- Fahrbahn mit `bicycle=no` neben einem Radweg: Die Fahrbahn hat `access_bicycle=no`, der Radweg hat seine eigene Kante.
- Weg mit `access=destination` und `bicycle=yes`: `access_bicycle=yes`.

## Radinfrastruktur an der Mittellinie

Radinfrastruktur, die an der Fahrbahn-Mittellinie gemappt ist (`side=left` oder `side=right`), hat ein leeres `access_bicycle`. Der Zugang der Fahrbahn (zum Beispiel `use_sidepath` oder `no`) gilt nicht für den Radweg selbst.

## Nicht in `routing`

- Wege mit `access`, `foot` (auf Fußwegen) oder `bicycle` (auf Radwegen) `private`, `delivery` oder `permit`, außer bei `bicycle=designated` (ausgeschilderter Radweg).
- Wege mit `service=*` außer `alley`, wenn sie keine eigene Radinfrastruktur haben.
- Wege mit dauerhaftem `access=no` (auf Fußwegen auch `foot=no`), außer Radfahren ist auf dem Weg selbst ausdrücklich erlaubt: der aufgelöste Wert (`bicycle`, sonst `vehicle`, sonst `access`) ist `yes`, `designated`, `permissive`, `discouraged` oder `dismount`. `use_sidepath` und `optional_sidepath` zählen nicht. Sie verweisen wie `cycleway=separate` auf einen Weg daneben. Mit `access=no` sind das meist gesperrte Straßen an Baustellen.
- `bicycle=no` auf einem Radweg schließt ihn aus. Ist der Radweg wegen einer Baustelle oder Sperrung zu (Text in `description`, `note`, `fixme` oder `access:reason`), wird er stattdessen als `lifecycle` geführt. Andere Fälle sind sehr selten und fast immer Tagging-Fehler.
- Fahrbahn- und Wege-Kanten von Wegen, die keine Zeile in `roads` / `roadsPathClasses` haben: `access=destination` oder `customers` ohne Erlaubnis für Radfahrende, `indoor=yes` und `informal=yes` ohne eigene Radinfrastruktur. Radinfrastruktur dieser Wege bleibt erhalten.
- Autobahnen und Schnellstraßen (`motorway`, `trunk`).

Die Gründe stehen in `helper/access_restriction.lua`.
