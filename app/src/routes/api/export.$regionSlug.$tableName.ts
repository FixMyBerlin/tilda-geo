import { exec, execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { exportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { formatDateBerlin } from '@/components/shared/date/formatDateBerlin'
import { isDev } from '@/components/shared/utils/isEnv'
import { getExportAttributeType } from '@/server/api/export/exportAttributeType'
import { formats, ogrFormats } from '@/server/api/export/ogrFormats.const'
import {
  badRequestJson,
  forbiddenJson,
  internalServerErrorJson,
  notFoundJson,
} from '@/server/api/util/apiJsonResponses.server'
import { resolveRegionAccessStatus } from '@/server/api/util/authGuards.server'
import { corsHeaders } from '@/server/api/util/cors'
import { getProcessingMeta } from '@/server/api/util/getProcessingMeta.server'
import { getBaseDatabaseUrl } from '@/server/database-url.server'
import { geoDataClient } from '@/server/prisma-client.server'

const exportMetadata = {
  licence: 'ODbL',
  attribution: '(c) OpenStreetMap; tilda-geo.de',
  owner: 'FixMyCity GmbH / TILDA Geo',
}

async function checkGdalVersion() {
  try {
    return new Promise<boolean>((resolve) => {
      exec('gdalinfo --version', { timeout: 5000 }, (error, stdout) => {
        if (error) {
          console.warn('[EXPORT] GDAL version check failed:', error.message)
          resolve(false)
          return
        }

        const versionMatch = stdout.match(/GDAL (\d+)\.(\d+)\.(\d+)/)
        if (!versionMatch) {
          console.warn('[EXPORT] Could not parse GDAL version from:', stdout)
          resolve(false)
          return
        }

        const major = parseInt(versionMatch[1] || '0', 10)
        const minor = parseInt(versionMatch[2] || '0', 10)

        const hasRequiredVersion = major > 3 || (major === 3 && minor >= 11)

        if (!hasRequiredVersion) {
          console.warn(
            `[EXPORT] GDAL version ${versionMatch[0]} is too old. Required: 3.11+ (gdal command introduced in 3.11.0)`,
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

const exportParamsSchema = z.object({
  regionSlug: z.string(),
  tableName: z.enum(exportApiIdentifier),
})

const exportSearchSchema = z.object({
  apiKey: z.string().optional(),
  minlon: z.coerce.number(),
  minlat: z.coerce.number(),
  maxlon: z.coerce.number(),
  maxlat: z.coerce.number(),
  format: z.enum(formats),
})

export const Route = createFileRoute('/api/export/$regionSlug/$tableName')({
  ssr: true,
  params: {
    parse: (rawParams) => exportParamsSchema.parse(rawParams),
  },
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const rawSearchParams = new URL(request.url).searchParams
        const parsedSearch = exportSearchSchema.safeParse({
          apiKey: rawSearchParams.get('apiKey') || '',
          minlon: rawSearchParams.get('minlon'),
          minlat: rawSearchParams.get('minlat'),
          maxlon: rawSearchParams.get('maxlon'),
          maxlat: rawSearchParams.get('maxlat'),
          format: rawSearchParams.get('format') || 'fgb',
        })

        if (!parsedSearch.success) {
          console.error(parsedSearch.error)
          return badRequestJson({
            headers: corsHeaders,
            info: z.flattenError(parsedSearch.error),
          })
        }
        const { regionSlug, tableName } = params
        const { apiKey, minlon, minlat, maxlon, maxlat, format } = parsedSearch.data

        const status = await resolveRegionAccessStatus({
          headers: request.headers,
          regionSlug,
          apiKey,
        })
        if (status !== 200) {
          if (status === 404) {
            return notFoundJson({ headers: corsHeaders })
          }
          return forbiddenJson({ headers: corsHeaders })
        }

        try {
          const tagKeyQuery: Array<{ key: string }> = await geoDataClient.$queryRawUnsafe(`
              SELECT DISTINCT jsonb_object_keys(tags) AS key
              FROM "${tableName}"
            `)
          const metaKeyQuery: Array<{ key: string }> = await geoDataClient.$queryRawUnsafe(`
              SELECT DISTINCT jsonb_object_keys(meta) AS key
              FROM "${tableName}"
            `)

          const columnExistsQuery: Array<{ column_name: string }> =
            await geoDataClient.$queryRawUnsafe(`
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
            const attributeType = getExportAttributeType(key)
            const sanitizedKey = sanitizeKey(key)

            return attributeType === 'number'
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
          `.replaceAll('"', '\\"')
          const outputFilePath = path.resolve(
            'public',
            'temp',
            `export-temp-${Date.now()}.${format}`,
          )
          const dbConnection = `PG:"${getBaseDatabaseUrl()}"`
          const layerName = regionSlug && regionSlug !== 'noRegion' ? regionSlug : undefined

          const isGdalAvailable = await checkGdalVersion()

          const ogrFormat = ogrFormats[format]
          const ogrCommand = `ogr2ogr \
            -f "${ogrFormat.driver}" \
            -sql "${sqlQuery}" \
            ${layerName ? `-nln ${layerName}` : ''} \
            "${outputFilePath}" \
            ${dbConnection}`

          await new Promise<void>((resolve, reject) => {
            exec(ogrCommand, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
              if (error) {
                reject(error)
                return
              }
              if (stderr && isDev) {
                console.warn('[EXPORT] ogr2ogr stderr:', stderr)
              }
              if (stdout && isDev) {
                console.info('[EXPORT] ogr2ogr stdout:', stdout)
              }
              resolve()
            })
          })

          if (isGdalAvailable) {
            const exportExt = path.extname(outputFilePath)
            const exportBase = path.basename(outputFilePath, exportExt)
            const exportDir = path.dirname(outputFilePath)
            // FlatGeobuf treats paths like "*.fgb.<non-ext>" as directory outputs; keep real suffix.
            const tempMetadataPath = path.join(exportDir, `${exportBase}.gdal-meta${exportExt}`)
            const metadataArgs = Object.entries(exportMetadata).flatMap(([key, value]) => [
              '--metadata',
              `${key}=${value}`,
            ])

            await new Promise<void>((resolve) => {
              execFile(
                'gdal',
                [
                  'vector',
                  'edit',
                  '-i',
                  outputFilePath,
                  '-o',
                  tempMetadataPath,
                  '-f',
                  ogrFormat.driver,
                  ...metadataArgs,
                ],
                { maxBuffer: 1024 * 1024 * 50 },
                (error) => {
                  void (async () => {
                    try {
                      if (error) {
                        console.warn('[EXPORT] gdal metadata update failed:', error.message)
                        await fs.unlink(tempMetadataPath).catch(() => {})
                      } else {
                        await fs.unlink(outputFilePath)
                        await fs.rename(tempMetadataPath, outputFilePath)
                      }
                    } catch (replaceError) {
                      console.warn('[EXPORT] gdal metadata replace failed:', replaceError)
                      await fs.unlink(tempMetadataPath).catch(() => {})
                    } finally {
                      resolve()
                    }
                  })()
                },
              )
            })
          }

          const fileBuffer = await fs.readFile(outputFilePath)
          await fs.unlink(outputFilePath)

          const metadata = await getProcessingMeta()
          const filename = metadata.osm_data_from
            ? `${tableName}_${formatDateBerlin(metadata.osm_data_from, 'yyyy-MM-dd')}.${format}`
            : `${tableName}.${format}`

          if (format === 'geojson' && request.headers.get('accept-encoding')?.includes('gzip')) {
            const compressed = gzipSync(fileBuffer)
            return new Response(compressed, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Content-Encoding': 'gzip',
                'Content-Length': compressed.length.toString(),
                'Content-Disposition': `attachment; filename="${filename}"`,
              },
            })
          }

          return new Response(fileBuffer, {
            headers: {
              ...corsHeaders,
              'Content-Type': ogrFormat.mimeType,
              'Content-Length': fileBuffer.length.toString(),
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          })
        } catch (error) {
          console.error(error)
          return internalServerErrorJson({ headers: corsHeaders, cause: error })
        }
      },
    },
  },
})
