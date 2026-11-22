---
title: Zugang Radverkehr im Routing (`access_bicycle`)
---

## Was `routing` enthält

`routing` ist ein Graph für Fahrrad-Router. Er enthält alle Zeilen aus `bikelanes`, `roads` und `roadsPathClasses`, bis auf die Ausnahmen unten. Jede Kante gehört zu genau einer Zeile dort (`source_table` und `source_id`) und trägt dieselben Werte. Die Geometrie ist für das Routing aufbereitet: Radinfrastruktur, die an der Fahrbahn gemappt ist, ist eine eigene Kante neben der Fahrbahn.

Ein Weg, der in zwei Tabellen steht, ist nur einmal im Graphen. Ein Radweg in `roadsPathClasses` und `bikelanes` oder eine Fahrradstraße in `roads` und `bikelanes` ist eine Kante aus `bikelanes`.

Diese Zeilen sind nicht im Graphen:

- Autobahnen und Schnellstraßen (`motorway`, `trunk`) und Radinfrastruktur, die an ihnen gemappt ist. Sie stehen in `roads`.
- Die Fahrbahn von Kraftfahrstraßen (`motorroad=yes`), weil Radfahren dort verboten ist. Sie steht in `roads`. Ein Radweg, der an einer Kraftfahrstraße gemappt ist, ist eine eigene Kante.
- Kanten mit einem Fahrrad-Zugang, den `access_bicycle` nicht abbilden kann, zum Beispiel `bicycle=limited`. Ein leeres Feld würde „Radfahren erlaubt“ bedeuten.
- Kurze Wege ohne Anschluss an das übrige Netz und kurze lose Enden.

Wege, die TILDA gar nicht zeigt, fehlen in allen Tabellen und damit auch im Graphen, zum Beispiel private Wege, Zufahrten ohne Radinfrastruktur oder Mountainbike-Trails.

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
