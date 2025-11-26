import db from '@/db'
import { isDev, isProd } from '@/src/app/_components/utils/isEnv'
import { numberConfigs } from '@/src/app/regionen/[regionSlug]/_components/SidebarInspector/TagsTable/translations/_utils/numberConfig'
import { exportApiIdentifier } from '@/src/app/regionen/[regionSlug]/_mapData/mapDataSources/export/exportIdentifier'
import { getBlitzContext } from '@/src/blitz-server'
import { geoDataClient } from '@/src/server/prisma-client'
import fs from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'node:child_process'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { z } from 'zod'
import { formats, ogrFormats } from './_utils/ogrFormats.const'

const ExportSchema = z.object({
  regionSlug: z.string(),
  tableName: z.enum(exportApiIdentifier),
  apiKey: z.string().optional(),
  minlon: z.coerce.number(),
  minlat: z.coerce.number(),
  maxlon: z.coerce.number(),
  maxlat: z.coerce.number(),
  format: z.enum(formats),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { regionSlug: string; tableName: string } },
) {
  const rawSearchParams = request.nextUrl.searchParams
  const parsedParams = ExportSchema.safeParse({
    regionSlug: params.regionSlug,
    tableName: params.tableName,
    apiKey: rawSearchParams.get('apiKey') || '',
    minlon: rawSearchParams.get('minlon'),
    minlat: rawSearchParams.get('minlat'),
    maxlon: rawSearchParams.get('maxlon'),
    maxlat: rawSearchParams.get('maxlat'),
    format: rawSearchParams.get('format') || 'fgb',
  })

  // VALIDATE PARAMS
  if (parsedParams.success === false) {
    const error = { error: 'Invalid input', ...parsedParams.error }
    console.error(error) // Log files
    return NextResponse.json(error, { status: 400 })
  }
  const { regionSlug, tableName, apiKey, minlon, minlat, maxlon, maxlat, format } =
    parsedParams.data

  // ACCESS CONTROL
  // calling an anonymous function to easily break out of nested ifs
  const status = await (async () => {
    // When apiKey valid, we ignore the region check
    if (apiKey === process.env.ATLAS_API_KEY) {
      return 200 // <==========
    }

    const region = await db.region.findFirst({ where: { slug: regionSlug } })
    if (!region) {
      return 404 // <==========
    }

    if (region.exportPublic === true) {
      return 200 // <==========
    }

    const { session } = await getBlitzContext()
    const { userId, role } = session

    if (!userId) {
      return 403 // <==========
    }

    if (role === 'ADMIN') {
      return 200 // <==========
    }

    const membershipExists = !!(await db.membership.count({
      where: { userId, region: { slug: regionSlug } },
    }))
    if (!membershipExists) {
      return 403 // <==========
    }

    // LATER: Check input bounding box if inside region bbox

    return 200 // <==========
  })()

  if (status !== 200) {
    return Response.json(status, { status })
  }

  // DATA
  try {
    const tagKeyQuery: Array<{ key: string }> = await geoDataClient.$queryRawUnsafe(`
        SELECT DISTINCT jsonb_object_keys(tags) AS key
        FROM "${tableName}"
      `)
    const metaKeyQuery: Array<{ key: string }> = await geoDataClient.$queryRawUnsafe(`
        SELECT DISTINCT jsonb_object_keys(meta) AS key
        FROM "${tableName}"
      `)

    // Check if osm_id and osm_type columns exist in the table
    const columnExistsQuery: Array<{ column_name: string }> = await geoDataClient.$queryRawUnsafe(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = '${tableName}'
        AND column_name IN ('osm_id', 'osm_type')
      `)
    const existingColumns = columnExistsQuery.map(({ column_name }) => column_name)
    const hasOsmId = existingColumns.includes('osm_id')
    const hasOsmType = existingColumns.includes('osm_type')

    const sanitizeKey = (key: string) => key.replace(/[^a-z]/gi, '_')
    const generateColumn = (key: string, columnType: 'tags' | 'meta') => {
      const numberKeywordsEquals = numberConfigs.map(({ key }) => key)
      const numberKeywordsIncludes = []
      const shouldCastToNumber = key.startsWith('osm_')
        ? false
        : numberKeywordsEquals.some((keyword) => key == keyword) ||
          numberKeywordsIncludes.some((keyword) => key.includes(keyword))
      const sanitizedKey = sanitizeKey(key)

      return shouldCastToNumber
        ? `CAST(${columnType}->>'${key}' AS numeric) AS "${sanitizedKey}"`
        : `${columnType}->>'${key}' AS "${sanitizedKey}"`
    }

    const columns = [
      'id',
      'geom',
      hasOsmId ? 'osm_id' : undefined,
      hasOsmType ? 'osm_type' : undefined,
      ...tagKeyQuery.map(({ key }) => generateColumn(key, 'tags')),
      ...metaKeyQuery.map(({ key }) => generateColumn(key, 'meta')),
    ]
      .filter(Boolean)
      .join(',\n')

    const sqlQuery = `
      SELECT ${columns}
      FROM public."${tableName}"
      WHERE geom && ST_Transform(
        (SELECT ST_SetSRID(ST_MakeEnvelope(${minlon}, ${minlat}, ${maxlon}, ${maxlat}), 4326)),
        3857
      )
    `
      // IMPORTANT: We need to escape all `"` used inside this query
      // See https://github.com/OSGeo/gdal/issues/11987#issuecomment-2736324614 for more
      .replaceAll('"', '\\"')
    const outputFilePath = path.resolve('public', 'temp', `export-temp-${Date.now()}.${format}`)
    const dbConnection = `PG:"${process.env.GEO_DATABASE_URL.replace('?pool_timeout=0', '')}"`
    // LATER: Add something like -lco WRITE_NULL_VALUES=NO to cleanup the NULL properties from GeoJSON
    // See https://github.com/OSGeo/gdal/issues/1187
    const ogrCommand = `ogr2ogr -f "${ogrFormats[format]}" ${outputFilePath} ${dbConnection} -t_srs EPSG:4326 -lco COORDINATE_PRECISION=8 -sql "${sqlQuery}"`

    console.log('Running ogr2ogr', isDev ? ogrCommand : undefined)
    await new Promise((resolve, reject) => {
      exec(ogrCommand, (error, stdout, stderr) => {
        if (error) {
          reject(stderr || error.message)
        } else {
          resolve(stdout)
        }
      })
    })

    const fileBuffer = await fs.readFile(outputFilePath)
    await fs.unlink(outputFilePath) // delete file

    if (format === 'geojson') {
      if (request.headers.get('accept-encoding')?.includes('gzip')) {
        // Compress the response for transfer efficiency
        // The browser will automatically decompress it due to Content-Encoding: gzip
        // and save it as a .geojson file
        const compressed = gzipSync(fileBuffer)
        return new Response(compressed, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
            'Content-Disposition': `attachment; filename="${tableName}.${format}"`,
            'Content-Length': compressed.length.toString(),
          },
        })
      }
      return new Response(fileBuffer, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${tableName}.${format}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      })
    }

    return new Response(fileBuffer, {
      headers: {
        'Content-Disposition': `attachment; filename="${tableName}.${format}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error(error) // Log files
    return Response.json(
      {
        error: 'Internal Server Error',
        info: isProd ? undefined : error,
      },
      { status: 500 },
    )
  }
}
