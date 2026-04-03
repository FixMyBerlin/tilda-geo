import type { TableId } from '@/data/processingTypes/tableId.generated.const'
import { geoDataLongRunningTxOptions } from '@/server/geoDataLongRunningTxOptions.server'
import { geoDataClient } from '../../prisma-client.server'

const lengthCounterIdentifier = (id: TableId) =>
  `atlas_aggregate_${id.toLowerCase()}` as `atlas_aggregate_${Lowercase<TableId>}`
const segmentizedTableIdentifier = (id: TableId) =>
  `temp_${id.toLowerCase()}_segmentized` as `temp_${Lowercase<TableId>}_segmentized`

async function registerCustomFunctions() {
  // Segmentized builds run sequentially so two interactive transactions do not contend on one client.
  await geoDataClient.$executeRaw`
    CREATE OR REPLACE FUNCTION atlas_segmentize_linestring(input_geom Geometry(LineString), input_length FLOAT, res INT)
    RETURNS TABLE(
      length FLOAT,
      geom Geometry(point)
    )
    AS $$
    DECLARE
      n INT := greatest(round(input_length / res), 1)::INT;
    BEGIN
      RETURN query
      SELECT
        input_length / n as length,
        ST_SetSRID
        (
          ST_LineInterpolatePoint(input_geom, (generate_series(1, n) - 0.5) / n),
          ST_SRID(input_geom)
        ) AS geom;
    END;
    $$
    LANGUAGE plpgsql;
  `

  const bikelanesSegmentizedPromise = geoDataClient.$transaction(async (tx) => {
    await tx.$executeRaw`
    CREATE TABLE IF NOT EXISTS "temp_bikelanes_segmentized" AS
      SELECT
        id,
        tags->>'category' AS aggregator_key,
        CASE
          WHEN tags->>'oneway' = 'yes' THEN 1
          WHEN tags->>'oneway' = 'implicit_yes' THEN 1
          ELSE 2
        END AS factor,
        (atlas_segmentize_linestring(geom, (tags->>'length')::FLOAT, 100)).*
      FROM
        bikelanes;`
    await tx.$executeRaw`
    CREATE INDEX IF NOT EXISTS "temp_bikelanes_segmentized_geom_idx" ON temp_bikelanes_segmentized USING gist(geom);`
    await tx.$executeRaw`
    CREATE INDEX IF NOT EXISTS "temp_bikelanes_segmentized_aggregator_idx" ON temp_bikelanes_segmentized (aggregator_key);`
  }, geoDataLongRunningTxOptions)

  const roadsSegmentizedPromiset = geoDataClient.$transaction(async (tx) => {
    await tx.$executeRaw`
    CREATE TABLE IF NOT EXISTS "temp_roads_segmentized" AS
      SELECT
        id,
        tags->>'road' AS aggregator_key,
        CASE
          WHEN tags->>'oneway' = 'yes' THEN 1
          WHEN tags->>'oneway' = 'yes_dual_carriageway' THEN 1
          ELSE 2
        END AS factor,
        (atlas_segmentize_linestring(geom, (tags->>'length')::FLOAT, 100)).*
      FROM
        roads;`
    await tx.$executeRaw`
    CREATE INDEX IF NOT EXISTS "temp_roads_segmentized_geom_idx" ON temp_roads_segmentized USING gist(geom);`
    await tx.$executeRaw`
    CREATE INDEX IF NOT EXISTS "temp_roads_segmentized_aggregator_idx" ON temp_roads_segmentized (aggregator_key);`
  }, geoDataLongRunningTxOptions)

  const counterPromises = ['roads', 'bikelanes'].map((id: TableId) => {
    return geoDataClient.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION ${lengthCounterIdentifier(id)}(input_polygon Geometry(MultiPolygon, 3857))
      RETURNS JSONB AS $$
      DECLARE
        aggregated_length JSONB;
      BEGIN
        SELECT
          jsonb_object_agg(aggregator_key, ROUND(total_length_km / 1000.0))
        INTO aggregated_length
        FROM (
          SELECT
            segmentized.aggregator_key,
            SUM(segmentized.length * segmentized.factor) AS total_length_km
          FROM
            ${segmentizedTableIdentifier(id)} as segmentized
          WHERE
            ST_Intersects(segmentized.geom, input_polygon)
          GROUP BY
            segmentized.aggregator_key
        ) AS aggregated_data;

        RETURN aggregated_length;
      END;
      $$ LANGUAGE plpgsql;
  `)
  })
  await bikelanesSegmentizedPromise
  await roadsSegmentizedPromiset
  await Promise.all(counterPromises)
}

export async function aggregateLengths() {
  await geoDataClient.$connect()
  await registerCustomFunctions()
  await geoDataClient.$executeRaw`
    CREATE TABLE IF NOT EXISTS "aggregated_lengths"
    (
      id TEXT UNIQUE,
      name TEXT,
      level TEXT,
      geom Geometry(MultiPolygon, 3857),
      bikelane_length JSONB,
      road_length JSONB
    );
    `
  return geoDataClient.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO "aggregated_lengths" (id, name, level, geom, bikelane_length, road_length)
      SELECT
        id,
        tags->>'name',
        tags->>'admin_level',
        geom,
        atlas_aggregate_bikelanes(geom),
        atlas_aggregate_roads(geom)
      FROM "boundaries"
      WHERE (tags->>'admin_level')::TEXT = '4'
        OR (tags->>'admin_level')::TEXT = '6'
      ON CONFLICT (id)
        DO UPDATE SET
          bikelane_length = EXCLUDED.bikelane_length,
          road_length = EXCLUDED.road_length;
  `
    await tx.$executeRaw`
    DROP INDEX IF EXISTS "aggregated_lengths_geom_idx";`
    await tx.$executeRaw`
    CREATE INDEX "aggregated_lengths_geom_idx" ON "aggregated_lengths" USING gist(geom);`
    await tx.$executeRaw`DROP TABLE temp_roads_segmentized;`
    await tx.$executeRaw`DROP TABLE temp_bikelanes_segmentized;`
  }, geoDataLongRunningTxOptions)
}
