-- Martin-compatible tile functions for the planning schema.
-- Martin auto-discovers functions in the public schema with the signature
--   (z int, x int, y int, query_params json) → bytea
-- so planning_hexagons and planning_vegetation are served by the same
-- Martin server as all other public sources.
--
-- query_params: { "run_id": "<int>" }

CREATE OR REPLACE FUNCTION public.planning_hexagons(
    z int, x int, y int, query_params json DEFAULT '{}'
)
RETURNS bytea LANGUAGE plpgsql STABLE PARALLEL SAFE AS $$
DECLARE
    run_id_val bigint := (query_params->>'run_id')::bigint;
    bounds     geometry := ST_TileEnvelope(z, x, y);
    -- From z16 the fine BASE grid (res 13), below that the coarse aggregate
    -- (res 11, ~49× fewer features). Must match AGG_H3_RES/BASE_H3_RES in
    -- planning-worker/flaechenfinder/scorer.py.
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
            score_platz,
            score_fussgaengerzone,
            score_bestand,
            score_eigendaten,
            score_bewohnerbedarf,
            cluster_area_m2,
            eignungsklasse,
            gebaeude,
            fahrbahn,
            eigendaten_ausschluss,
            eigendaten_details,
            ST_AsMVTGeom(geom, bounds, 4096, 256, true) AS geom
        FROM planning.scenario_hexagons
        WHERE run_id = run_id_val
          AND resolution = res_val
          AND geom && bounds
    ) t
    WHERE t.geom IS NOT NULL;

    -- Separate point layer for the label (only from z18, see HEXAGON_LABEL_MIN_ZOOM in
    -- SourcesLayersSpaceFinder.tsx): the fill layer above buffers & clips the hexagon
    -- polygons per tile (buffer=256) so the fill stays seamless at tile edges — but the
    -- same polygon then often lands in several tiles, each with its own centroid shifted
    -- toward the visible part. A symbol layer based on that would produce multiple,
    -- off-center labels per hexagon. Instead the label layer uses the true hexagon
    -- center, unbuffered (buffer=0) and filtered via ST_Contains against the unexpanded
    -- tile bounds — so each hexagon yields its center in exactly one tile.
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

-- Census population points (resident demand factor) as a point layer.
--
-- Reads directly from `data.census_population_point` – NO copy per run: the
-- table covers all of Germany (~24M points, EPSG:5243) and lives in this DB
-- anyway. It shows exactly the extent the scoring uses:
-- `PostgisLoader.load_census_population()` filters with
-- `geom && ST_Transform(study_area, 5243)`, i.e. the Planungsgebiet bounding
-- box – the same condition is below. The Planungsgebiet comes from the run's
-- frozen `factorConfigSnapshot`, so the layer matches the result even if the
-- area was edited later.
--
-- If the data schema is missing on this environment (table not imported), the
-- function returns NULL instead of an error – like the graceful fallbacks in the worker.
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
    -- Like _study_area_from_config() in the worker: unwrap Feature/FeatureCollection.
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
            -- Both conditions use the GiST index in the source CRS. The tile
            -- is expanded by 10 % before transforming so the projection
            -- distortion 3857 → 5243 does not drop points at tile edges;
            -- ST_AsMVTGeom then clips exactly.
            WHERE c.total > 0
              AND c.geom && ST_Transform(ST_Expand(bounds, (ST_XMax(bounds) - ST_XMin(bounds)) * 0.1), 5243)
              AND c.geom && area_5243
        ) t
        WHERE t.geom IS NOT NULL
    );
END;
$$;
