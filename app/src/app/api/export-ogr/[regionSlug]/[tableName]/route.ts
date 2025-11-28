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

const exportMetadata = {
  licence: 'ODbL',
  attribution: '(c) OpenStreetMap; tilda-geo.de',
  owner: 'FixMyCity GmbH / TILDA Geo',
}

/**
 * Check if GDAL 3.11+ is available (required for gdal vector edit command)
 * The `gdal` command was introduced in GDAL 3.11.0
 * @returns Promise that resolves to true if GDAL 3.11+ is available, false otherwise
 */
async function checkGdalVersion(): Promise<boolean> {
  try {
    return new Promise<boolean>((resolve) => {
      // Try to get GDAL version using gdalinfo (more reliable than gdal command)
      exec('gdalinfo --version', { timeout: 5000 }, (error, stdout) => {
        if (error) {
          console.warn('[EXPORT] GDAL version check failed:', error.message)
          resolve(false)
          return
        }

        // Parse version from output like "GDAL 3.10.3, released 2025/04/01"
        const versionMatch = stdout.match(/GDAL (\d+)\.(\d+)\.(\d+)/)
        if (!versionMatch) {
          console.warn('[EXPORT] Could not parse GDAL version from:', stdout)
          resolve(false)
          return
        }

        const major = parseInt(versionMatch[1] || '0', 10)
        const minor = parseInt(versionMatch[2] || '0', 10)

        // GDAL 3.11+ required for gdal vector edit (gdal command introduced in 3.11.0)
        const hasRequiredVersion = major > 3 || (major === 3 && minor >= 11)

        if (!hasRequiredVersion) {
          console.warn(
            `[EXPORT] GDAL version ${versionMatch[0]} is too old. Required: 3.11+ (gdal command introduced in 3.11.0)`
          )
        }

        resolve(hasRequiredVersion)
      })
    })
  } catch (error) {
    console.warn('[EXPORT] GDAL version check error:', error)
    return false
  }
}

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
    // -nln assigns an alternate name to the new layer (works for GPKG/FGB, safely ignored for GeoJSON)
    // Include region parameter in layer name only if it's a real region (not 'noRegion' placeholder)
    const layerName =
      regionSlug === 'noRegion'
        ? `tilda-geo.de/docs/${tableName}`
        : `tilda-geo.de/docs/${tableName}?r=${regionSlug}`
    const ogrCommand = `ogr2ogr -f "${ogrFormats[format]}" ${outputFilePath} ${dbConnection} -t_srs EPSG:4326 -lco COORDINATE_PRECISION=8 -sql "${sqlQuery}" -nln ${layerName}`

    console.log('[EXPORT] Running ogr2ogr', isDev ? ogrCommand : undefined)
    await new Promise((resolve, reject) => {
      exec(ogrCommand, (error, stdout, stderr) => {
        if (error) {
          reject(stderr || error.message)
        } else {
          resolve(stdout)
        }
      })
    })

    // Add metadata for formats that support it (skip GeoJSON)
    // HOTFIX: Only add metadata if GDAL 3.11+ is available (gdal vector edit requires 3.11+)
    if (format !== 'geojson' && (await checkGdalVersion())) {
      const escapeForShell = (str: string) => str.replace(/"/g, '\\"')
      // Use same extension so GDAL can detect the format (e.g., .gpkg.meta -> .meta.gpkg)
      const pathParts = path.parse(outputFilePath)
      const metadataFilePath = path.join(pathParts.dir, `${pathParts.name}.meta${pathParts.ext}`)
      const metadataCommand = `gdal vector edit --metadata LICENSE="${escapeForShell(exportMetadata.licence)}" --metadata OWNER="${escapeForShell(exportMetadata.owner)}" --metadata ATTRIBUTION="${escapeForShell(exportMetadata.attribution)}" ${outputFilePath} ${metadataFilePath}`

      console.log('[EXPORT] Adding metadata', isDev ? metadataCommand : undefined)
      await new Promise((resolve, reject) => {
        exec(metadataCommand, async (error, stdout, stderr) => {
          if (error) {
            await fs.rm(metadataFilePath, { force: true })
            await fs.rm(outputFilePath, { force: true })
            reject(new Error(`Failed to add metadata: ${stderr || error.message}`))
          } else {
            // Replace original with metadata-enhanced file
            await fs.rename(metadataFilePath, outputFilePath)
            resolve(stdout)
          }
        })
      })
    }

    const fileBuffer = await fs.readFile(outputFilePath)
    await fs.rm(outputFilePath, { force: true })

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
