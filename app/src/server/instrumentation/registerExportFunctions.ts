import {
  exportApiIdentifier,
  exportFunctionIdentifier,
} from '@/src/app/regionen/[regionSlug]/_mapData/mapDataSources/export/exportIdentifier'
import { geoDataClient } from '@/src/server/prisma-client'

// specify license and attribution for data export
// const license = "'ODbL 1.0, https://opendatacommons.org/licenses/odbl/'"
// const attribution = "'OpenStreetMap, https://www.openstreetmap.org/copyright; tilda-geo.de'"

// See the following issues on tests to handle type `number`/`float` and `null` values
// https://github.com/flatgeobuf/flatgeobuf/discussions/342#discussioncomment-11806223
// https://github.com/FixMyBerlin/private-issues/issues/2239#issuecomment-2585264839
function generateKeys(keyQuery: Array<{ key: string }>, columnType: 'tags' | 'meta'): string {
  return keyQuery
    .map(({ key }) => {
      return `              COALESCE(${columnType}->>'${key}', '') as "${key}"`
    })
    .join(',\n')
}

export async function registerExportFunctions(tables: typeof exportApiIdentifier) {
  return Promise.all(
    tables.map(async (tableName) => {
      const functionName = exportFunctionIdentifier(tableName)
      const tagKeyQuery: Array<{ key: string }> = await geoDataClient.$queryRawUnsafe(`
        SELECT DISTINCT jsonb_object_keys(tags) AS key
        FROM "${tableName}"
      `)
      const metaKeyQuery: Array<{ key: string }> = await geoDataClient.$queryRawUnsafe(`
        SELECT DISTINCT jsonb_object_keys(meta) AS key
        FROM "${tableName}"
      `)
      const tagKeys = generateKeys(tagKeyQuery, 'tags')
      const metaKeys = generateKeys(tagKeyQuery, 'meta')

      if (!tagKeys || !metaKeys) {
        console.error(
          'Failed to `registerExportFunctions` because required tagKeys or metaKeys are empty',
          JSON.stringify({ functionName, tagKeyQuery, metaKeyQuery }),
        )
      }

      return geoDataClient.$transaction([
        geoDataClient.$executeRawUnsafe(`
          DROP FUNCTION IF EXISTS public."${functionName}"(region Geometry(Polygon));
        `),
        geoDataClient.$executeRawUnsafe(`
          CREATE FUNCTION public."${functionName}"(region Geometry(Polygon))
          RETURNS BYTEA
          LANGUAGE plpgsql
          AS $$
          DECLARE
          fgb BYTEA;
          BEGIN
          SELECT ST_AsFlatGeobuf(q, false, 'geom') INTO fgb FROM (
            SELECT st_transform(geom, 4326) AS geom,
              id,
              ${tagKeys},
              ${metaKeys}
            FROM "${tableName}"
            WHERE geom && ST_Transform(region, 3857) AND minzoom > -1
          ) q;
          RETURN fgb;
          END;
          $$;
        `),
      ])
    }),
  )
}
