---
title: Versetzte Geometrien
---

Ein Teil der Geometrien für Radinfrastruktur wird von der Straßen-Mittellinie abgeleitet (siehe Hinweise „Transformierte Geometrie“ im Inspektor in der Kartenansicht). Diese abgeleiteten Geometrien liegen in den Daten **auf der Straßen-Mittellinie** – sie werden nicht mehr nach links bzw. rechts verschoben. Das hält die Daten einfacher analysierbar, weil keine künstliche seitliche Verschiebung berücksichtigt werden muss.

Den empfohlenen seitlichen Versatz stellt das Attribut `offset` bereit: ein vorzeichenbehafteter Wert in Metern (positiv = links, negativ = rechts der Referenzlinie), der im Processing aus der halben Straßenbreite berechnet wird. Der Versatz wird **rein visuell im Kartenstil** angewendet (`line-offset`), so dass die beiden Straßenseiten in der Karte weiterhin getrennt dargestellt werden.

**HINWEIS:** Der visuelle Versatz wirkt nur auf Linien-Ebenen. Symbol- bzw. Text-Ebenen, die entlang der Linie platziert werden (z. B. Breiten-, Oberflächen- oder Verkehrsschild-Beschriftungen), liegen auf der Mittellinie und werden nicht seitlich versetzt.
