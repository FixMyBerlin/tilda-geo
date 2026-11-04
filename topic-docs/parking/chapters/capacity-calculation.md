---
title: Berechnung der Kapazität
---

Die Stellplatzanzahl (`capacity`) wird in der Prozessierung abgeleitet, wenn in OpenStreetMap keine explizite Angabe vorliegt. Die Herkunft ist im Feld `capacity_source` dokumentiert.

## Subtraktives Modell

Aus OSM-Daten zu Parken links und rechts der Fahrbahn werden Liniengeometrien erzeugt. Bereiche, in denen nicht geparkt werden kann oder darf – z. B. Einfahrten, Haltestellen, Hindernisse, Parkverbote – werden „ausgestanzt“. Die verbleibende Linienlänge ist die Grundlage für Flächen- und Kapazitätsschätzungen.

Zusätzlich zu in OSM erfassten Hindernissen kann ein ergänzender Stanzungs-Datensatz (Einfahrten, Poller, Bäume, Laternen u. a.) genutzt werden, wo OSM-Lücken bestehen. Explizite OSM-Stanzungen haben Vorrang; externe Stanzungen werden verworfen, wenn sie ungeeignet sind.

## Schätzung aus Länge und Ausrichtung

Für nicht markierte Stellplätze wird die Kapazität aus der Linienlänge des Parksegments und der Parkausrichtung (`orientation`) interpoliert. Dabei gilt ein einheitliches „Standardfahrzeug“:

| Ausrichtung   | Fahrzeuglänge entlang der Kante | Fahrzeugtiefe quer zur Kante | Abstand zwischen Fahrzeugen |
| ------------- | ------------------------------- | ---------------------------- | --------------------------- |
| parallel      | 4,4 m                           | 2,0 m                        | 0,8 m                       |
| perpendicular | 2,0 m                           | 4,4 m                        | 0,5 m                       |
| diagonal      | berechnet (30°-Rotation)        | berechnet                    | berechnet                   |

Formel (Länge): `(Länge + Abstand) / (Fahrzeuglänge + Abstand)`

Die Fläche (`area`) wird bei fehlender Geometrie aus der Länge geschätzt: `Länge × (Fahrzeugtiefe + 0,25 m)`. `area_source` ist dann `estimated`.

## Rundung

Berechnete Kapazitäten werden vor der Ausgabe gerundet:

- **Unter 10 Stellplätzen:** Abrunden, ab 0,8 aufgerundet (Beispiel: 1,5 → 1; 1,8 → 2; 4,9 → 5).
- **Ab 10 Stellplätzen:** Mathematische Rundung.

Damit wird kleineren Parklücken Rechnung getragen, die von kürzeren Fahrzeugen belegt werden können, ohne systematisch zu überschätzen.

## Alternierendes Parken

Bei `staggered=yes` und paralleler Ausrichtung wird die Kapazität angepasst:

1. Halbierung (nur eine Straßenseite wird gleichzeitig genutzt).
2. Abzug von Manövrierraum: pro 60 m Abschnitt werden 10 m (≈ 1,9 Stellplätze bei 5,2 m pro Platz) abgezogen.

Interne QA-Felder `_staggered_original_capacity` und `_staggered_maneuvering_loss` dokumentieren die Zwischenschritte.

## Explizite OSM-Angaben und Umverteilung

Liegt in OSM `capacity` oder `est_capacity` vor, wird dieser Wert übernommen (`capacity_source`: `tag` bzw. `tag_estimation`). Wird ein Segment durch Stanzung geteilt, wird die Kapazität anteilig nach Länge umverteilt (`*_redistributed` in `capacity_source`).

## Nachvollziehbarkeit

| Feld                   | Bedeutung                                    |
| ---------------------- | -------------------------------------------- |
| `capacity`             | Stellplatzanzahl (gerundet)                  |
| `capacity_source`      | Herleitung (Tag, Schätzung, Umverteilung, …) |
| `capacity_confidence`  | Konfidenz der Angabe                         |
| `length`               | Länge der Parklinie in Metern                |
| `area` / `area_source` | Fläche und Herkunft                          |
