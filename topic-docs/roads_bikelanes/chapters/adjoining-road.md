---
title: Angrenzende Straße (`adjoining_*`)
---

`adjoining_road` und `adjoining_maxspeed` sind Indikatoren für die Gefährdung durch nahen Kfz-Verkehr, auch wenn der Weg selbstständig geführt ist, aber in der Nähe einer Kfz-Straße liegt. Sie nennen Klasse und zulässige Höchstgeschwindigkeit der Kfz-Straße, deren Verkehr für diesen Weg relevant ist. Sie sagen **nicht**, ob der Weg zu dieser Straße gehört. Zwischen beiden kann zum Beispiel ein Graben, eine Baumreihe oder eine Lärmschutzwand liegen.

- Bei begleitenden Wegen ist das die **parallele** Straße.
- Bei Querungen ist das die **gequerte** Straße.
- Bei Fahrradstraßen und Fußgängerzonen mit Rad frei gibt es keine `adjoining_*`-Attribute. Die Daten stehen bereits unter `road` / `maxspeed`.
- Bei Infrastruktur, die auf der Fahrbahn geführt wird (beispielsweise Schutzstreifen, Radfahrstreifen, Bussonderfahrstreifen), gibt es keine `adjoining_*`-Attribute. Die Daten stehen bereits unter `road` / `maxspeed`.

## Die Schätzung

Die Sidepath-Schätzung setzt Checkpoints entlang der Wege (Gehwege, Radwege, Pfade, Treppen und Wirtschaftswege) und sucht Straßen im Umkreis von **22 m**. Eine Kfz-Straße gilt als nahe, wenn sie an der Mehrheit dieser Checkpoints innerhalb von 22 m liegt.

Diese 22 m gelten als Luftlinie und unterscheiden nicht, ob der Weg direkt an der Fahrbahn liegt oder beispielsweise durch eine Hecke von ihr getrennt ist.

Je ein Checkpoint sitzt nahe am Start und nahe am Ende, um 20 m eingerückt, damit Kreuzungen nicht mitzählen. Zusätzlich liegt immer ein Mittelpunkt auf dem Weg. Wege kürzer als 40 m erhalten nur diesen Mittelpunkt.

Querungen nutzen keine Checkpoints. Die CSV nimmt die Kfz-Straße, die die Geometrie schneidet (bei mehreren die höchste Klasse).

## Quellen

Der Wert ist immer ein TILDA-`roads.road`.

1. **Querungen:** nur die CSV (gequerte Straße). OSM `is_sidepath:of` benennt dort meist die parallele Elternstraße, nicht die gequerte Fahrbahn.
2. **Sonst, wenn `is_sidepath:of` eine nutzbare Straßenklasse ist:** dieser Wert. Eine Kartierung kann die Schätzung damit überschreiben. Der Tag kennt nur OSM-`highway`-Klassen ohne Untertags. `trunk`/`trunk_link`, Tippfehler und Straßennamen fallen weg. `residential_priority_road` entsteht aus `:of` nicht; wenn beide Quellen da sind, bleibt der gröbere `:of`-Wert (`residential`).
3. **Sonst:** TILDA-`roads.road` aus dem **vorherigen** Processing-Lauf (CSV).

`adjoining_maxspeed` gehört zur CSV-Klasse und wird nur übernommen, wenn dieselbe Klasse veröffentlicht wird.

## Leseregel auf `routing`

`adjoining_road` auf routing ist **derselbe Wert wie auf `bikelanes`**. Auf `side=left`/`right` (Infrastruktur auf der Fahrbahn) ist das Feld leer; die Straßenklasse steht dort auf `road` bzw. `parent_road`. Auf `side=self` (Wege, Querungen) gilt `adjoining_road`.
