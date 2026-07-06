-- Planning module result schema.
--
-- Lives in its own `planning` schema so it is NOT auto-published by Martin
-- (martin.yaml only publishes `public`) and is untouched by the daily viewer
-- cache-clear. Result geometries are keyed by run_id (= prisma."PlanningRun".id)
-- and are immutable once written: a re-run produces a new run_id.
--
-- Idempotent: applied on worker startup and safe to run repeatedly.

CREATE SCHEMA IF NOT EXISTS planning;

CREATE TABLE IF NOT EXISTS planning.scenario_hexagons (
  run_id                  bigint NOT NULL,
  h3_id                   text   NOT NULL,
  geom                    geometry(Polygon, 3857) NOT NULL,
  mce_gesamtscore         real,
  score_radweg            real,
  score_bodenbelag        real,
  score_zielorte          real,
  score_hangneigung       real,
  score_oepnv             real,
  score_vegetation        real,
  eignungsklasse          text
);

-- Nachträglich für bereits bestehende Tabellen (CREATE TABLE IF NOT EXISTS oben
-- fügt einer vorhandenen Tabelle keine Spalte hinzu).
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_vegetation real;

-- Getrennte Teil-Scores (Issue #3415): Bedarfswahrscheinlichkeit (ÖPNV, Zielorte)
-- und Bebauungswahrscheinlichkeit (Radweg, Untergrund, Hangneigung
-- + Modifier + Ausschluss). NULL bei Alt-Läufen bzw. wenn die
-- Gruppe im Szenario komplett ungewichtet ist. mce_gesamtscore bleibt die
-- unveränderte Kombination.
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_bedarf real;
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_bebauung real;

-- Kreuzungs-Bonus: Zuschlag nahe Bordstein-Ecken (Radabstellanlagen); NULL wenn
-- der Faktor (w_intersection) im Szenario nicht gewichtet ist.
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_kreuzung real;

-- Parken-Bonus: Zuschlag auf/nahe bestehenden KFZ-Parkflächen (Umwidmung zu
-- Radabstellanlagen); NULL wenn der Faktor (w_parken) im Szenario nicht
-- gewichtet ist.
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_parken real;

-- Fußgängerzonen-Bonus: besonders hoher Zuschlag an Ecken, wo eine Straße auf
-- eine Fußgängerzone trifft (Bedarfsgruppe); NULL wenn der Faktor
-- (w_fussgaengerzone) im Szenario nicht gewichtet ist.
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS score_fussgaengerzone real;

-- H3-Auflösung der Zeile: BASE (13) = feines Scoring-Gitter für hohe
-- Zoomstufen, AGG (11) = grobes Aggregat für z < 16. Beide Gitter desselben
-- Laufs liegen in dieser Tabelle; die Martin-Funktion planning_hexagons wählt
-- je Zoomstufe. Default 13, damit vorhandene Zeilen als BASE-Gitter gelten.
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS resolution smallint NOT NULL DEFAULT 13;

-- Liegt das Hexagon auf einem Gebäude (public._buildings)? Solche Zellen sind
-- hart ausgeschlossen (mce_gesamtscore = 0); das Flag erlaubt der Sidebar, den
-- Ausschlussgrund „Gebäude" anzuzeigen. Nur im Fein-Gitter (Res 13) gesetzt.
ALTER TABLE planning.scenario_hexagons ADD COLUMN IF NOT EXISTS gebaeude boolean NOT NULL DEFAULT false;

-- Potentialflächen (aus Hexagonen abgeleitete Polygone) werden nicht mehr
-- berechnet; Altbestand aus früheren Läufen aufräumen.
DROP TABLE IF EXISTS planning.scenario_areas;

-- On-demand berechnete Vegetationsflächen (NDVI), pro Lauf gespeichert.
CREATE TABLE IF NOT EXISTS planning.scenario_vegetation (
  run_id     bigint NOT NULL,
  geom       geometry(MultiPolygon, 3857) NOT NULL,
  ndvi       real,
  flaeche_m2 real
);

CREATE INDEX IF NOT EXISTS scenario_hexagons_run_id_idx ON planning.scenario_hexagons (run_id);
CREATE INDEX IF NOT EXISTS scenario_hexagons_run_res_idx ON planning.scenario_hexagons (run_id, resolution);
CREATE INDEX IF NOT EXISTS scenario_hexagons_geom_idx   ON planning.scenario_hexagons USING gist (geom);
CREATE INDEX IF NOT EXISTS scenario_vegetation_run_id_idx ON planning.scenario_vegetation (run_id);
CREATE INDEX IF NOT EXISTS scenario_vegetation_geom_idx   ON planning.scenario_vegetation USING gist (geom);
