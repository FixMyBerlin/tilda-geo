---
title: ERA-Check
---

Der ERA-Check prüft Radverkehrsanlagen automatisiert gegen die **FGSV ERA 2010, Tabelle 5** („Breitenmaße von Radverkehrsanlagen und Sicherheitstrennstreifen“). Derzeit wird nur die **Breite** geprüft; weitere Attribute – zuerst der Sicherheitstrennstreifen zum ruhenden Verkehr – kommen später dazu.

## Grundsatz: bewertet wird nur, was erfasst ist

Fehlende Angaben führen nie zu einem Mangel, sondern zu „nicht bewertbar“. Das gilt auch für die Führungsform: Ist aus den Daten nicht eindeutig, um welchen Anlagentyp es sich handelt, wird gegen **alle** in Frage kommenden Zeilen der Tabelle geprüft. Ein Ergebnis wird nur ausgewiesen, wenn es für alle gleich ausfällt. Ein Beispiel: Eine 1,70 m breite Anlage, bei der offen ist, ob sie Schutz- oder Radfahrstreifen ist, erfüllt in beiden Fällen das Regelmaß und wird deshalb als konform ausgewiesen.

## Die geprüften Maße

| Anlagentyp                       | Regelmaß | Mindestmaß | Klammerwert |
| -------------------------------- | -------- | ---------- | ----------- |
| Schutzstreifen                   | 1,50 m   | 1,25 m     | –           |
| Radfahrstreifen                  | 1,85 m   | –          | –           |
| Einrichtungsradweg               | 2,00 m   | –          | (1,60 m)    |
| Beidseitiger Zweirichtungsradweg | 2,50 m   | –          | (2,00 m)    |
| Einseitiger Zweirichtungsradweg  | 3,00 m   | –          | (2,50 m)    |
| Gemeinsamer Geh- und Radweg      | 2,50 m   | –          | –           |

Tabelle 5 führt den gemeinsamen Geh- und Radweg getrennt nach innerorts (≥ 2,50 m, abhängig von Fußgänger- und Radverkehrsstärke) und außerorts (2,50 m). Für die Breite macht das keinen Unterschied, deshalb steht hier eine Zeile.

## Markierung: 0,25 m

Die Breiten der Tabelle 5 gelten „jeweils einschließlich Markierung“. Wir gehen davon aus, dass das OSM-Tag `width` **ohne** Markierung erfasst wurde. Bei Schutz- und Radfahrstreifen rechnen wir deshalb 0,25 m Markierung hinzu, bevor wir vergleichen; bei baulichen Anlagen ohne Markierung nicht. Ein Radfahrstreifen mit `width=1.6` wird also mit 1,85 m gemessen und erfüllt das Regelmaß.

## Verkehrsrichtung

Ob ein Radweg als Einrichtungs- oder als Zweirichtungsradweg zu messen ist, hängt an der Verkehrsrichtung. Steht sie nicht in einem OSM-Tag, sondern ist aus der Führungsform abgeleitet oder geschätzt, folgen wir dieser Annahme – kennzeichnen die Bewertung aber als **„vermutlich“** (Attribut Konfidenz der ERA-Bewertung). Trifft die Annahme nicht zu, gilt ein anderes Regelmaß und die Bewertung kann kippen.

Beim Zweirichtungsradweg unterscheidet die ERA zusätzlich, ob es an der Straße nur diesen einen (einseitig, 3,00 m) oder auf beiden Seiten je einen gibt (beidseitig, 2,50 m). Bei eigenständig erfassten Geometrien ist das nicht bestimmbar; dann wird gegen beide Varianten geprüft.

## Innerorts und außerorts

Steht zur Verkehrsrichtung eines baulichen Radwegs gar nichts in OSM, hilft die Lage weiter: Innerorts sind Radwege in der Regel Einrichtungsradwege (Regelmaß 2,00 m), außerorts führen sie in der Regel beide Richtungen (2,50 bzw. 3,00 m). Wir nutzen dafür eine Schätzung, ob der Weg **überwiegend** – also mit mehr als der Hälfte seiner Länge – innerhalb einer Siedlungsfläche liegt.

Wo diese Annahme das Ergebnis trägt, steht sie im Attribut **ERA-Lage** und die Bewertung gilt nur als „vermutlich“ richtig. Die Lage ist eine Schätzung, kein erfasster Wert; die Bewertung ist an diesen Stellen also entsprechend zurückhaltend zu lesen.

Für den gemeinsamen Geh- und Radweg spielt die Lage keine Rolle: Tabelle 5 nennt innerorts wie außerorts 2,50 m. Gebraucht wird sie darüber hinaus beim Sicherheitstrennstreifen zur Fahrbahn (1,75 m an Landstraßen), der noch nicht geprüft wird.

## Getrennte Geh- und Radwege

Tabelle 5 hat für den getrennten Geh- und Radweg keine eigene Zeile; sein Radwegteil ist ein Einrichtungs- oder Zweirichtungsradweg und wird auch so gemessen. Voraussetzung ist, dass die erfasste Breite tatsächlich den Radweg meint. Davon gehen wir aus, wenn sie aus `cycleway:<seite>:width` stammt, oder wenn über `traffic_mode:right` erfasst ist, was neben dem Weg liegt – dann ist der Gehweg eine eigene Geometrie. Beschreibt eine Linie dagegen Geh- und Radweg zusammen, bleibt die Breite unbewertet.

## Verhältnis zur FGSV E-Klima

> Um objektive und subjektive Sicherheit und damit eine gesteigerte Nutzung von Radverkehrsanlagen zu gewährleisten, sind ausreichend breite Anlagen zur Verfügung zu stellen. Die in den RASt 06 und ERA, Ausgabe 2010 angegebenen Regelmaße für Radverkehrsführungen sind als Mindestwerte anzusehen und diese Anlagen sind möglichst breiter zu wählen. Die in den RASt 06 und ERA angegebenen Klammerwerte für Radverkehrsanlagen sind nicht mehr anzuwenden.

Daraus folgt: **E-Klima-konform ist genau, was das Regelmaß erfüllt.** „Nur Mindestmaß erfüllt“ und „nur Klammerwert erfüllt“ sind es nicht.

## Führungsformen ohne Vorgabe

Für Fahrradstraßen, Gehwege mit Radfahrer frei, Bussonderfahrstreifen, Fußgängerzonen, Querungen und Verbindungsstücke nennt Tabelle 5 kein Breitenmaß. Sie erhalten keine ERA-Attribute; im Inspektor steht dann ausdrücklich, dass keine ERA-Bewertung möglich ist.

Zwei Führungsformen kennt die ERA 2010 noch nicht; wir messen sie hilfsweise am Radfahrstreifen: den **geschützten Radfahrstreifen** und den **Radfahrstreifen in Mittellage** (Fahrradweiche).
