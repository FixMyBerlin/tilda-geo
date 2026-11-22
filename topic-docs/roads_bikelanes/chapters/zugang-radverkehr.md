---
title: Zugang Radverkehr im Routing (`access_bicycle`)
---

## Was `routing` enthält

`routing` ist ein Graph für Fahrrad-Router. Er baut auf denselben Wegen auf wie `bikelanes`, `roads` und `roadsPathClasses`: Jede Kante gehört zu genau einer Zeile dort (`source_table` und `source_id`), die Werte, die `routing` mitführt, sind dieselben wie dort. Die Geometrie ist für das Routing aufbereitet. Radinfrastruktur, die an der Fahrbahn gemappt ist, ist eine eigene Kante neben der Fahrbahn.

Wege, die TILDA nicht zeigt, fehlen auch im Graphen, zum Beispiel private Wege, Zufahrten ohne Radinfrastruktur oder Mountainbike-Trails. Autobahnen, Schnellstraßen (`motorway`, `trunk`) und die Fahrbahn von Kraftfahrstraßen (`motorroad=yes`) sind nicht enthalten, weil Radfahren dort verboten ist. Ein Radweg, der an einer Kraftfahrstraße gemappt ist, ist als eigene Kante enthalten.

## Router müssen `access_bicycle` auswerten

Der Graph enthält auch Kanten, auf denen Radfahren nicht erlaubt ist, zum Beispiel eine Fahrbahn mit Radverbot oder eine Anliegerstraße. Sie sind enthalten, damit ein Router selbst entscheiden kann, zum Beispiel für ein Ziel an einer Anliegerstraße. Ein Fahrrad-Router muss sie über `access_bicycle` selbst herausfiltern.

| `access_bicycle`                                                                              | Radfahren     |
| --------------------------------------------------------------------------------------------- | ------------- |
| leer                                                                                          | erlaubt       |
| `yes`, `designated`, `permissive`, `use_sidepath`, `discouraged`, `dismount`                  | erlaubt       |
| `no`, `destination`, `private`, `customers`, `delivery`, `permit`, `agricultural_or_forestry` | nicht erlaubt |

`use_sidepath` steht auf einer Fahrbahn mit benutzungspflichtigem Radweg daneben. Radfahren auf der Fahrbahn ist dann erlaubt, ein Router sollte aber den Radweg bevorzugen.

## Radinfrastruktur an der Fahrbahn

Radinfrastruktur, die an der Fahrbahn gemappt ist (`side=left` oder `side=right`), hat ein leeres `access_bicycle`. Der Zugang der Fahrbahn gilt nicht für sie: Eine Fahrbahn mit `use_sidepath` oder `no` hat trotzdem einen befahrbaren Radfahrstreifen.
