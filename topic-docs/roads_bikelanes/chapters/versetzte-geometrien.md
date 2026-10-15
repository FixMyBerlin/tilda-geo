---
title: Versetzte Geometrien
---

Ein Teil der Geometrien für Radinfrastruktur wird von der Straßen-Mittellinie abgeleitet (siehe Hinweise „Transformierte Geometrie“ im Inspektor in der Kartenansicht). Diese abgeleiteten Geometrien liegen in den Daten **auf der Straßen-Mittellinie** – sie werden nicht mehr nach links bzw. rechts verschoben. Das hält die Daten einfacher analysierbar, weil keine künstliche seitliche Verschiebung berücksichtigt werden muss.

Den empfohlenen seitlichen Versatz stellt das Attribut `offset` bereit: ein vorzeichenbehafteter Wert in Metern (positiv = links, negativ = rechts der Referenzlinie), der im Processing aus der halben Straßenbreite berechnet wird. Der Versatz wird **rein visuell im Kartenstil** angewendet (`line-offset`), so dass die beiden Straßenseiten in der Karte weiterhin getrennt dargestellt werden.

Die Linienrichtung bleibt die Fahrtrichtung bei Rechtsverkehr. Rechte abgeleitete Geometrien laufen in OSM-Way-Richtung, linke werden umgekehrt (gegen die OSM-Way-Richtung). Richtungsabhängige Attribute (`mapillary_forward` / `mapillary_backward`, `traffic_sign_forward` / `traffic_sign_backward`) beziehen sich weiter auf die OSM-Way-Richtung.

**HINWEIS:** Der visuelle Versatz wirkt auf Linien-Ebenen und auf Beschriftungen und Icons entlang der Linie (Breite, Oberfläche, Brücke, Tunnel, Baustelle; sehr kurze Wege zeigen ihr Icon erst beim Hineinzoomen). Verkehrsschild-Beschriftungen liegen weiter auf der Mittellinie.
