---
title: Aufgeteilte Objekte und geschätzte Geometrie
---

In OpenStreetMap ist eine Abstellanlage manchmal als ein Objekt erfasst, obwohl sie Stellplätze verschiedener Art hat, zum Beispiel 10 Stellplätze, davon 2 für Lastenräder (`capacity=10`, `capacity:cargo_bike=2`). TILDA zeigt jede Art als eigenes Objekt mit eigener Anzahl: 8 Fahrradstellplätze und 2 Lastenrad-Stellplätze. Das zweite Objekt hat dieselbe OSM-ID mit der Art als Zusatz (`way/123/cargo_bike_parking`).

Wo die Lastenrad-Stellplätze genau stehen, steht nicht in OpenStreetMap. TILDA schätzt deshalb die Lage beider Teile:

- **Fläche:** Die Fläche wird quer zu ihrer Längsachse geteilt. Dabei stehen die Bügel in einer Reihe, ein Fahrradbügel alle 1,2 m und ein Lastenradbügel alle 2 m, je 2 Räder pro Bügel; jeder Teil bekommt so viel von der Länge, wie seine Stellplätze brauchen.
- **Linie:** Die Linie wird in der Mitte geteilt; jeder Teil liegt in der Mitte seiner Hälfte.
- **Punkt:** Die beiden Teile werden in Ost–West-Richtung nebeneinander gesetzt.

Das Merkmal `geometry_transform` nennt, welcher Fall angewendet wurde; im Inspektor erscheint dazu ein Hinweis. Genauer wird es, wenn die Lastenrad-Stellplätze in OpenStreetMap als eigenes Objekt erfasst werden.
