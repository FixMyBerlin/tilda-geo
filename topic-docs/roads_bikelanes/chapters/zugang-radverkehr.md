---
title: Zugang Radverkehr im Routing (`access_bicycle`)
---

## Was `routing` enthält

`routing` ist ein Graph für Fahrrad-Router. Er enthält alle Zeilen aus `bikelanes`, `roads` und `roadsPathClasses`, bis auf die Ausnahmen unten. Jede Kante gehört zu genau einer Zeile dort (`source_table` und `source_id`). Sie trägt nur eine Auswahl der Werte, die ein Router braucht, zum Beispiel `category`, `road`, `surface`, `width`, `maxspeed` und `access_bicycle`. Alle anderen Werte bekommt man über einen Join auf die Zeile in der Quelltabelle.

### Geometrie und Richtung

Jede Kante hat die Geometrie des OSM-Wegs. Ein Weg wird nicht nach Fahrtrichtung geteilt: Ein Weg, auf dem man in beide Richtungen fahren darf, ist eine Kante mit `oneway=no`. Bei `oneway=yes` zeigt die Linie in die erlaubte Richtung, ein OSM-Weg mit `oneway=-1` ist dafür umgedreht. `oneway_motor=yes` heißt: Autos fahren nur in Linienrichtung, Fahrräder in beide Richtungen, zum Beispiel in einer Einbahnstraße, die für den Radverkehr in Gegenrichtung frei ist.

Radinfrastruktur, die an der Fahrbahn gemappt ist (zum Beispiel `cycleway:right=lane`), ist eine eigene Kante auf derselben Geometrie wie die Fahrbahn. Die Linie wird nicht verschoben. `side` sagt, auf welcher Seite die Radinfrastruktur liegt, `offset` den seitlichen Abstand zur Mittellinie (positiv links, negativ rechts). Die Linie zeigt in die Fahrtrichtung der Radinfrastruktur: rechts in Richtung des OSM-Wegs, links dagegen, wenn `cycleway:<side>:oneway` nichts anderes sagt. Auf einer Einbahnstraße zeigen beide Seiten in die Richtung der Fahrbahn.

### Wege in zwei Tabellen

Ein Weg, der in zwei Tabellen steht, ist nur einmal im Graphen. Ein Radweg in `roadsPathClasses` und `bikelanes` oder eine Fahrradstraße in `roads` und `bikelanes` ist eine Kante aus `bikelanes`.

### Was nicht im Graphen ist

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
