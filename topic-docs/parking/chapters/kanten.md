---
title: Straßenkanten
---

`parkings_edges` fasst das Parknetz zwischen Knotenpunkten (OSM-Knoten, an denen nicht genau zwei Kanten zusammenlaufen) zu einer Linie zusammen. Das Netz sind dieselben OSM-Ways, für die TILDA Straßenparken erzeugt (`has_parking`: normale Straßen sowie Einfahrten/`highway=service` mit expliziten `parking:*`-Tags).

Die Objekt-ID ist das Paar `start_node`-`end_node`. Liegen zwei Kanten auf demselben Knotenpaar (parallele Geometrien), erhält die zweite einen Suffix.

Kapazität je Seite: `capacity_left` / `capacity_right` sind die öffentlichen Stellplätze, deren Parklinie auf **dieser** Kante liegt (Straßenparken auf der Bordsteinlinie sowie separat erfasste Parkflächen, deren Linie auf der Polygonkante liegt). Ein OSM-Way, der an einer Kreuzung in mehrere Kanten zerfällt, gibt jeder Kante nur die Stellplätze auf diesem Abschnitt, nicht einen Längenanteil der gesamten Way-Kapazität. `capacity_private_*` ist die private Summe, wenn vorhanden. Einträge in `parkings_no` zählen nicht.

Separat erfasste Parkflächen (Quelle `separate_parking_areas`, also als Fläche kartierte `street_side`- und `lane`-Buchten) werden im Umkreis von 6 m dem nächsten Bordstein zugeordnet; liegt jedes Teilstück einer Parklinie unter 20 % ihrer Länge, bleibt das längste Teilstück erhalten.

Pro Straßenseite gewinnt der Operator mit mehr Stellplätzen (bei Gleichstand öffentlich). `operator_type_*` sowie Beschränkung, Lage und Oberfläche stammen nur aus dieser Gruppe. Die Karte zeigt die Hilfslinie und die Zahl in der passenden Unterkategorie.
