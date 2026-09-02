# MCE-Scoring

Wie aus dem H3-Hexagon-Gitter der Gesamtscore je Hexagon berechnet wird.
Kerncode: [`flaechenfinder/scorer.py`](flaechenfinder/scorer.py)
(`run_flaechenfinder()`).

## Ablauf

1. **H3-Gitter generieren** – das Studiengebiet wird mit H3-Hexagonen in Res. 13
   (`BASE_H3_RES`) überdeckt (`h3.geo_to_cells`).
2. **Teilscores je Hexagon** (0–100, aus Distanz zu Layern bzw. Attributen):
   - `score_radweg` – Nähe zu `public.bikelanes`
   - `score_zielorte` – Nähe zu den im Szenario konfigurierten `targets`
   - `score_hangneigung` – DEM-Hangneigung (`slope_score`)
   - `score_oepnv` – Nähe zu ÖPNV-Haltestellen und Bikesharing (max. über 6 Typen:
     U-Bahn-Eingang, Straßenbahn, Bus, Bahnhof, Bahnhofsgebäude, Bikesharing;
     Bikesharing mit demselben Radius wie Bushaltestellen)
3. **Basis-Score** – gewichtete Summe der Teilscores (`weights` im
   `factorConfig`, siehe [`flaechenfinder/config.py`](flaechenfinder/config.py)).
4. **Vegetations-Effekt** – kein additiver Teilscore, sondern stufenloser
   Abzug/Bonus auf den Basis-Score (Details: [`VEGETATION.md`](VEGETATION.md)).
   `mce_gesamtscore = clamp(base ± Effekt, 0, 100)`.
5. **Harte Ausschlüsse** – unabhängig vom gewichteten Score wird `mce_gesamtscore`
   auf 0 gesetzt, wenn eines zutrifft:
   - Hangneigung zu steil (`score_hangneigung == 0`)
   - Radweg weiter als `max_cyclepath_dist_m` entfernt (Default 150 m)
   - Gebäudeüberschneidung (`gebaeude`)
6. **Klassifikation** – `eignungsklasse` wird aus `mce_gesamtscore` gebinnt
   (`_KLASSE_BINS`/`_KLASSE_LABELS`):

   | Score  | Klasse         |
   | ------ | -------------- |
   | 0      | ausgeschlossen |
   | 0–40   | schlecht       |
   | 40–60  | mittel         |
   | 60–80  | gut            |
   | 80–100 | sehr gut       |

## Zoom-Aggregation (Darstellung)

Für niedrige Zoomstufen (z < 16) werden die feinen Res-13-Hexagone zusätzlich
per `aggregate_hexagons()` auf H3-Res. 11 (`AGG_H3_RES`) zusammengefasst – reine
Mittelwertbildung der Score-Spalten je `h3.cell_to_parent`, `eignungsklasse` wird
daraus neu abgeleitet. Kein Re-Scoring, keine Spatial-Joins. Die Zoom-Verzweigung
(`z >= 16 → Res 13, sonst Res 11`) muss mit der Martin-Funktion
`planning_hexagons` in [`sql/martin_functions.sql`](sql/martin_functions.sql)
übereinstimmen.
