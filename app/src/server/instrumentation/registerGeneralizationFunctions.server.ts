import { generalizationFunctionIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/generalization/generalizationIdentifier'
import { interactivityConfiguration } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/generalization/interacitvityConfiguartion'
import type { TableId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/tables.const'
import { geoDataClient } from '@/server/prisma-client.server'
import { SIMPLIFY_MAX_ZOOM, SIMPLIFY_MIN_ZOOM } from './generalization.const'

async function registerCustomFunction() {
  return geoDataClient.$executeRaw`
    CREATE OR REPLACE FUNCTION atlas_jsonb_select(json_in JSONB, keys text[])
    RETURNS JSONB AS $$
    DECLARE
      json_out JSONB := '{}';
      key text;
    BEGIN
      FOREACH key IN ARRAY keys
      loop
        IF json_in ? key THEN
            json_out := json_out || jsonb_build_object(key, json_in -> key);
          END IF;
      END LOOP;
      RETURN json_out;
    END;
    $$ LANGUAGE plpgsql;`
}

async function createTileSpecification(tableName: TableId) {
  // Get column names and types
  type ColumnInfoRow = { fields: Record<string, string> }
  const columnInformation = await geoDataClient.$queryRawUnsafe<ColumnInfoRow[]>(`
  SELECT jsonb_object_agg(column_name, udt_name) - 'geom' - 'minzoom' AS fields
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = '${tableName}';`)
  const { fields } = columnInformation?.[0] ?? {}

  // Get the geometric extent (minX, minY, maxX, maxY in WGS84)
  type BboxRow = { bounds: [number, number, number, number] }
  const rows = await geoDataClient.$queryRawUnsafe<BboxRow[]>(
    `SELECT Array[ST_XMIN(bbox), ST_YMIN(bbox), ST_XMAX(bbox), ST_YMAX(bbox)] AS bounds
     FROM (
      SELECT ST_Transform(ST_SetSRID(ST_Extent(geom), 3857), 4326) AS bbox
        FROM "${tableName}"
      ) extent;`,
  )
  const bounds = rows[0]?.bounds
  // format as vector tile specifaction
  const tileSpecification = {
    vector_layers: [{ id: tableName, fields }],
    ...(bounds != null && { bounds }),
  }
  return tileSpecification
}

function toSqlArray(arr: string[]) {
  return `Array[${arr.map((tag) => `'${tag}'`)}]::text[]`
}

export async function registerGeneralizationFunctions() {
  await registerCustomFunction()

  for (const [tableName, { minzoom: fullTagsMinZoom, stylingKeys }] of Object.entries(
    interactivityConfiguration,
  )) {
    const typedTableName = tableName as TableId
    const functionName = generalizationFunctionIdentifier(typedTableName)
    // Gather meta information for the tile specification
    const tileSpecification = await createTileSpecification(typedTableName)

    await geoDataClient.$transaction([
      geoDataClient.$executeRawUnsafe(`
            CREATE OR REPLACE
            FUNCTION public."${functionName}"(z integer, x integer, y integer)
            RETURNS bytea AS $$
            DECLARE
              mvt bytea;
              tolerance float;
            BEGIN
              IF z BETWEEN ${SIMPLIFY_MIN_ZOOM} AND ${SIMPLIFY_MAX_ZOOM - 1} THEN
                tolerance = 10 * POWER(2, ${SIMPLIFY_MAX_ZOOM - 1}-z);
              ELSE
                tolerance = 0;
              END IF;
              SELECT INTO mvt ST_AsMVT(tile, '${tableName}', 4096, 'geom') FROM (
                SELECT
                  id,
                  ST_AsMVTGeom(
                    ST_CurveToLine(
                      ST_Simplify(geom, tolerance, true)
                    ),
                    ST_TileEnvelope(z, x, y), 4096, 64, true) AS geom,
                  CASE WHEN z >= ${fullTagsMinZoom} THEN tags ELSE atlas_jsonb_select(tags, ${toSqlArray(
                    stylingKeys,
                  )}) END as tags,
                  CASE WHEN z >= ${fullTagsMinZoom} THEN meta ELSE NULL END as meta
                FROM "${tableName}"
                WHERE (geom && ST_TileEnvelope(z, x, y)) AND z >= minzoom
              ) AS tile;
              RETURN mvt;
            END
            $$ LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE;
          `),
      geoDataClient.$executeRawUnsafe(`
            COMMENT ON FUNCTION ${functionName} IS '${JSON.stringify(tileSpecification)}';
          `),
    ])
  }
}
