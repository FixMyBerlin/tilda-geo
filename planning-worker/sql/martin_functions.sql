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
BEGIN
    RETURN (
        SELECT ST_AsMVT(t, 'planning_hexagons', 4096, 'geom')
        FROM (
            SELECT
                h3_id,
                mce_gesamtscore,
                score_bedarf,
                score_bebauung,
                score_radweg,
                score_bodenbelag,
                score_hangneigung,
                score_oepnv,
                score_zielorte,
                score_vegetation,
                score_kreuzung,
                score_parken,
                score_fussgaengerzone,
                score_bestand,
                score_eigendaten,
                cluster_area_m2,
                eignungsklasse,
                gebaeude,
                fahrbahn,
                ST_AsMVTGeom(geom, bounds, 4096, 256, true) AS geom
            FROM planning.scenario_hexagons
            WHERE run_id = run_id_val
              AND resolution = res_val
              AND geom && bounds
        ) t
        WHERE t.geom IS NOT NULL
    );
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
