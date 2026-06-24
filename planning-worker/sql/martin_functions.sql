-- Martin-kompatible Tile-Funktionen für das planning-Schema.
-- Martin auto-discovert Funktionen aus dem public-Schema, die die Signatur
--   (z int, x int, y int, query_params json) → bytea
-- haben. Damit werden planning_hexagons und planning_areas über denselben
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
BEGIN
    RETURN (
        SELECT ST_AsMVT(t, 'planning_hexagons', 4096, 'geom')
        FROM (
            SELECT
                h3_id,
                mce_gesamtscore,
                score_radweg,
                score_bodenbelag,
                score_hangneigung,
                score_hindernisfreiheit,
                score_oepnv,
                score_zielorte,
                score_vegetation,
                eignungsklasse,
                ST_AsMVTGeom(geom, bounds, 4096, 256, true) AS geom
            FROM planning.scenario_hexagons
            WHERE run_id = run_id_val
              AND geom && bounds
        ) t
        WHERE t.geom IS NOT NULL
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.planning_areas(
    z int, x int, y int, query_params json DEFAULT '{}'
)
RETURNS bytea LANGUAGE plpgsql STABLE PARALLEL SAFE AS $$
DECLARE
    run_id_val bigint := (query_params->>'run_id')::bigint;
    bounds     geometry := ST_TileEnvelope(z, x, y);
BEGIN
    RETURN (
        SELECT ST_AsMVT(t, 'planning_areas', 4096, 'geom')
        FROM (
            SELECT
                mce_gesamtscore,
                flaeche_m2,
                ST_AsMVTGeom(geom, bounds, 4096, 256, true) AS geom
            FROM planning.scenario_areas
            WHERE run_id = run_id_val
              AND geom && bounds
        ) t
        WHERE t.geom IS NOT NULL
    );
END;
$$;

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
