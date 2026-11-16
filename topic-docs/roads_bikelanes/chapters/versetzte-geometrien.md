---
title: Versetzte Geometrien
---

Ein Teil der Geometrien für Radinfrastruktur wird von der Straßen-Mittellinie abgeleitet (siehe Hinweise „Transformierte Geometrie“ im Inspektor in der Kartenansicht). Diese abgeleiteten Geometrien liegen in den Daten **auf der Straßen-Mittellinie** – sie werden nicht mehr nach links bzw. rechts verschoben. Das hält die Daten einfacher analysierbar, weil keine künstliche seitliche Verschiebung berücksichtigt werden muss.

Den empfohlenen seitlichen Versatz stellt das Attribut `offset` bereit: ein vorzeichenbehafteter Wert in Metern (positiv = links, negativ = rechts der Linie, bezogen auf ihre Richtung), der im Processing aus der halben Straßenbreite berechnet wird. Der Versatz wird **rein visuell im Kartenstil** angewendet (`line-offset`), so dass die beiden Straßenseiten in der Karte weiterhin getrennt dargestellt werden.

Abgeleitete Geometrien zeigen in Fahrtrichtung. Sie folgt [`cycleway:<Seite>:oneway`](https://wiki.openstreetmap.org/wiki/DE:Key:cycleway:right:oneway), das sich auf die Zeichenrichtung des OSM-Ways bezieht (`yes` = mit, `-1` = gegen den Way):

- Ohne Angabe an einer Straße ohne Einbahnregelung (Rechtsverkehr): rechte Geometrien laufen in OSM-Way-Richtung, linke gegen sie.
- Ohne Angabe an einer Einbahnstraße (auch Kreisverkehr): beide Seiten laufen in Fahrtrichtung der Straße. Ein Radfahrstreifen in Gegenrichtung braucht deshalb `cycleway:<Seite>:oneway=-1`. Die alte Schreibweise `cycleway=opposite_lane` / `opposite_track` gilt als Gegenrichtung.
- Mit Angabe gilt die Angabe, auch wenn sie vom Standard abweicht (z. B. `cycleway:left:oneway=yes`).
- Radinfrastruktur in beide Richtungen (`cycleway:<Seite>:oneway=no`) hat keine Fahrtrichtung. Hier laufen linke Geometrien gegen die OSM-Way-Richtung, rechte mit ihr.

Bei Rechtsverkehr liegt die Radinfrastruktur deshalb in der Regel rechts ihrer Linie (`offset` negativ), auch auf der linken Straßenseite, deren Linie gegen den OSM-Way läuft. Liegt sie links von ihrer Linie (z. B. linker Radfahrstreifen an einer Einbahnstraße in Fahrtrichtung), ist `offset` positiv.

Richtungsabhängige Attribute (`mapillary_forward` / `mapillary_backward`, `traffic_sign_forward` / `traffic_sign_backward`) beziehen sich auf die Linienrichtung: Läuft die Linie gegen den OSM-Way, sind die Paare getauscht.

**HINWEIS:** Der visuelle Versatz wirkt auf Linien-Ebenen und auf Beschriftungen und Icons entlang der Linie (Breite, Oberfläche, Brücke, Tunnel, Baustelle; sehr kurze Wege zeigen ihr Icon erst beim Hineinzoomen). Verkehrsschild-Beschriftungen liegen weiter auf der Mittellinie.
