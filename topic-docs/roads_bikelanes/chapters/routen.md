---
title: Routen und Netze (`route_relations`)
---

`route_relations` sagt, zu welchen Routen und Netzen ein Weg gehört. Alles über die Route selbst (Name, Ref, Netzebene, Farbe, Verlauf) steht nicht am Weg, sondern in den Routen-Tabellen.

## Format

Gruppen sind mit `;` getrennt, innerhalb einer Gruppe stehen Name und Einträge mit `:`, mehrere Einträge mit `,`:

`bicycle:2788485,12138805;bus:1234567;radnetz_berlin:Vorrangnetz`

- **OSM-Routen:** Gruppe ist der OSM-Wert `route=*` (`bicycle`, `mtb`, `bus`, `foot`, `hiking`), Einträge sind OSM-Relation-IDs. Name, Ref und Netz stehen in den Tabellen `bikeroutes`, `mtbroutes`, `busroutes`, `footroutes` und `hikingroutes`.
- **Netze aus externen Daten:** eine Gruppe je Netz mit genau einer Klasse je Linie. Heute `radnetz_berlin` (Radnetz Berlin aus infraVelo) mit `Vorrangnetz`, `Ergänzungsnetz` oder `Sonstiges`. Ein Weg und seine Seiten (z. B. `cycleway/left`) können verschiedene Klassen haben.
