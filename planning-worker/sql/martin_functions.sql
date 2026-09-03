-- Martin-kompatible Tile-Funktionen für das planning-Schema.
-- Martin auto-discovert Funktionen aus dem public-Schema, die die Signatur
--   (z int, x int, y int, query_params json) → bytea
-- haben. Damit werden planning_hexagons und planning_vegetation über denselben
-- Martin-Server ausgeliefert wie alle anderen public-Quellen.
--
-- query_params: { "run_id": "<int>" }

CREATE OR REPLACE FUNCTION public.planning_hexagons(
    z int, x int, y int, query_params json DEFAULT '{}'
)
RETURNS bytea LANGUAGE plpgsql STABLE PARALLEL SAFE AS $$
DECLARE
    run_id_val bigint := (query_params->>'run_id')::bigint;
    bounds     geometry := ST_TileEnvelope(z, x, y);
    -- Ab z16 das feine BASE-Gitter (Res 13), darunter das grobe Aggregat
    -- (Res 11, ~49× weniger Features). Muss mit AGG_H3_RES/BASE_H3_RES in
    -- planning-worker/flaechenfinder/scorer.py übereinstimmen.
    res_val    smallint := CASE WHEN z >= 16 THEN 13 ELSE 11 END;
    hex_mvt    bytea;
    label_mvt  bytea;
BEGIN
    SELECT ST_AsMVT(t, 'planning_hexagons', 4096, 'geom')
    INTO hex_mvt
    FROM (
        SELECT
            h3_id,
            mce_gesamtscore,
            score_bedarf,
            score_bebauung,
            score_radweg,
            score_hangneigung,
            score_oepnv,
            score_zielorte,
            score_vegetation,
            score_kreuzung,
            score_parken,
            score_fussgaengerzone,
            score_bestand,
            score_eigendaten,
            score_bewohnerbedarf,
            cluster_area_m2,
            eignungsklasse,
            gebaeude,
            fahrbahn,
            eigendaten_ausschluss,
            ST_AsMVTGeom(geom, bounds, 4096, 256, true) AS geom
        FROM planning.scenario_hexagons
        WHERE run_id = run_id_val
          AND resolution = res_val
          AND geom && bounds
    ) t
    WHERE t.geom IS NOT NULL;

    -- Eigener Punkt-Layer für das Label (nur ab z18, siehe HEXAGON_LABEL_MIN_ZOOM in
    -- SourcesLayersPlanning.tsx): der Fläche-Layer oben puffert & schneidet die
    -- Hexagon-Polygone pro Kachel (buffer=256), damit die Füllung an Kachelgrenzen
    -- nahtlos bleibt — dasselbe Polygon liegt dadurch aber oft in mehreren Kacheln,
    -- je mit einem eigenen, zur sichtbaren Teilfläche versetzten Zentroid. Ein darauf
    -- basierendes Symbol-Layer würde also mehrfache, außermittige Labels je Hexagon
    -- erzeugen. Der Label-Layer nimmt stattdessen den echten Hexagon-Mittelpunkt,
    -- ungepuffert (buffer=0) und via ST_Contains auf die ungeweiteten Kachelgrenzen
    -- gefiltert — jedes Hexagon liefert seinen Mittelpunkt so in genau einer Kachel.
    IF z >= 18 THEN
        SELECT ST_AsMVT(t, 'planning_hexagons_label', 4096, 'geom')
        INTO label_mvt
        FROM (
            SELECT
                h3_id,
                mce_gesamtscore,
                score_bedarf,
                score_bebauung,
                ST_AsMVTGeom(ST_Centroid(geom), bounds, 4096, 0, true) AS geom
            FROM planning.scenario_hexagons
            WHERE run_id = run_id_val
              AND resolution = res_val
              AND ST_Contains(bounds, ST_Centroid(geom))
        ) t;
    END IF;

    RETURN NULLIF(COALESCE(hex_mvt, ''::bytea) || COALESCE(label_mvt, ''::bytea), ''::bytea);
END;
$$;

DROP FUNCTION IF EXISTS public.planning_areas(int, int, int, json);

CREATE OR REPLACE FUNCTION public.planning_vegetation(
    z int, x int, y int, query_params json DEFAULT '{}'
)
RETURNS bytea LANGUAGE plpgsql STABLE PARALLEL SAFE AS $$
DECLARE
    run_id_val bigint := (query_params->>'run_id')::bigint;
    bounds     geometry := ST_TileEnvelope(z, x, y);
BEGIN
    RETURN (
        SELECT ST_AsMVT(t, 'planning_vegetation', 4096, 'geom')
        FROM (
            SELECT
                ndvi,
                flaeche_m2,
                ST_AsMVTGeom(geom, bounds, 4096, 256, true) AS geom
            FROM planning.scenario_vegetation
            WHERE run_id = run_id_val
              AND geom && bounds
        ) t
        WHERE t.geom IS NOT NULL
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.planning_carriageways(
    z int, x int, y int, query_params json DEFAULT '{}'
)
RETURNS bytea LANGUAGE plpgsql STABLE PARALLEL SAFE AS $$
DECLARE
    run_id_val bigint := (query_params->>'run_id')::bigint;
    bounds     geometry := ST_TileEnvelope(z, x, y);
BEGIN
    RETURN (
        SELECT ST_AsMVT(t, 'planning_carriageways', 4096, 'geom')
        FROM (
            SELECT
                width_m,
                ST_AsMVTGeom(geom, bounds, 4096, 256, true) AS geom
            FROM planning.scenario_carriageways
            WHERE run_id = run_id_val
              AND geom && bounds
        ) t
        WHERE t.geom IS NOT NULL
    );
END;
$$;

-- Zensus-Einwohnerpunkte (Bewohnerbedarf-Faktor) als Punktlayer.
--
-- Liest direkt aus `data.census_population_point` – KEINE Kopie pro Lauf: die
-- Tabelle deckt ganz Deutschland ab (~24 Mio. Punkte, EPSG:5243) und liegt
-- ohnehin in dieser DB. Gezeigt wird genau der Ausschnitt, den auch das Scoring
-- benutzt: `PostgisLoader.load_census_population()` filtert mit
-- `geom && ST_Transform(study_area, 5243)`, also über die Bounding-Box des
-- Planungsgebiets – dieselbe Bedingung steht unten. Das Planungsgebiet kommt aus
-- dem eingefrorenen `factorConfigSnapshot` des Laufs, damit der Layer zum
-- Ergebnis passt, auch wenn das Gebiet später bearbeitet wurde.
--
-- Fehlt das Data-Schema auf dieser Umgebung (Tabelle nicht importiert), liefert
-- die Funktion NULL statt eines Fehlers – wie die graceful Fallbacks im Worker.
CREATE OR REPLACE FUNCTION public.planning_census(
    z int, x int, y int, query_params json DEFAULT '{}'
)
RETURNS bytea LANGUAGE plpgsql STABLE PARALLEL SAFE AS $$
DECLARE
    run_id_val bigint := NULLIF(query_params->>'run_id', '')::bigint;
    bounds     geometry := ST_TileEnvelope(z, x, y);
    geo        jsonb;
    area_5243  geometry;
BEGIN
    IF run_id_val IS NULL OR to_regclass('data.census_population_point') IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT "factorConfigSnapshot" -> 'study_area' INTO geo
    FROM prisma."PlanningRun" WHERE id = run_id_val;
    IF geo IS NULL THEN
        RETURN NULL;
    END IF;
    -- Wie _study_area_from_config() im Worker: Feature/FeatureCollection auspacken.
    IF geo->>'type' = 'FeatureCollection' THEN
        geo := geo->'features'->0->'geometry';
    ELSIF geo->>'type' = 'Feature' THEN
        geo := geo->'geometry';
    END IF;
    area_5243 := ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(geo::text), 4326), 5243);

    RETURN (
        SELECT ST_AsMVT(t, 'planning_census', 4096, 'geom')
        FROM (
            SELECT
                c.total AS einwohner,
                ST_AsMVTGeom(ST_Transform(c.geom, 3857), bounds, 4096, 256, true) AS geom
            FROM data.census_population_point c
            -- Beide Bedingungen laufen über den GiST-Index im Quell-CRS. Die
            -- Kachel wird vor dem Transformieren um 10 % geweitet, damit die
            -- Projektionsverzerrung 3857 → 5243 an den Kachelrändern keine
            -- Punkte verschluckt; ST_AsMVTGeom schneidet danach exakt zu.
            WHERE c.total > 0
              AND c.geom && ST_Transform(ST_Expand(bounds, (ST_XMax(bounds) - ST_XMin(bounds)) * 0.1), 5243)
              AND c.geom && area_5243
        ) t
        WHERE t.geom IS NOT NULL
    );
END;
$$;
