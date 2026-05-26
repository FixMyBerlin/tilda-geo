import { exec, execFile } from 'node:child_process'
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
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

let gdalVersionCheckPromise: Promise<boolean> | null = null
let hasLoggedUnsupportedGdalVersion = false

async function checkGdalVersion() {
  if (gdalVersionCheckPromise) return gdalVersionCheckPromise

  gdalVersionCheckPromise = new Promise<boolean>((resolve) => {
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

      if (!hasRequiredVersion && !hasLoggedUnsupportedGdalVersion) {
        console.info(
          `[EXPORT] GDAL version ${versionMatch[0]} does not support metadata-enrichment step (requires 3.11+). Export generation continues without metadata edits.`,
        )
        hasLoggedUnsupportedGdalVersion = true
      }

      resolve(hasRequiredVersion)
    })
  })

  try {
    return await gdalVersionCheckPromise
  } catch (error) {
    console.warn('[EXPORT] GDAL version check error:', error)
    gdalVersionCheckPromise = null
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

const createExportRunId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const unlinkExportFile = async (outputFilePath: string, logPrefix: string, reason: string) => {
  try {
    await fs.unlink(outputFilePath)
  } catch (unlinkError) {
    console.warn(logPrefix, 'failed to remove temp export file', {
      outputFilePath,
      reason,
      unlinkError,
    })
  }
}

const createExportFileResponseStream = ({
  outputFilePath,
  logPrefix,
  requestStartedAt,
}: {
  outputFilePath: string
  logPrefix: string
  requestStartedAt: number
}) => {
  const nodeStream = createReadStream(outputFilePath)
  let bytesStreamed = 0
  let didCleanup = false
  const cleanupFile = (reason: string) => {
    if (didCleanup) return
    didCleanup = true
    void unlinkExportFile(outputFilePath, logPrefix, reason)
  }

  return new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on('data', (chunk: Buffer) => {
        bytesStreamed += chunk.length
        controller.enqueue(new Uint8Array(chunk))
      })
      nodeStream.on('end', () => {
        controller.close()
        console.info(logPrefix, 'stream completed', {
          bytesStreamed,
          totalDurationMs: Date.now() - requestStartedAt,
        })
        cleanupFile('stream_completed')
      })
      nodeStream.on('error', (streamError) => {
        console.error(logPrefix, 'stream failed', {
          bytesStreamed,
          totalDurationMs: Date.now() - requestStartedAt,
          streamError,
        })
        controller.error(streamError)
        cleanupFile('stream_failed')
      })
    },
    cancel(cancelReason) {
      nodeStream.destroy()
      console.warn(logPrefix, 'stream canceled by client', {
        bytesStreamed,
        totalDurationMs: Date.now() - requestStartedAt,
        cancelReason,
      })
      cleanupFile('stream_canceled')
    },
  })
}

export const Route = createFileRoute('/api/export/$regionSlug/$tableName')({
  ssr: true,
  params: {
    parse: (rawParams) => exportParamsSchema.parse(rawParams),
  },
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const exportRunId = createExportRunId()
        const logPrefix = `[EXPORT:${exportRunId}]`
        const requestStartedAt = Date.now()
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
          console.error(logPrefix, 'invalid export query params', {
            url: request.url,
            issues: parsedSearch.error.issues,
          })
          return badRequestJson({
            headers: corsHeaders,
            info: z.flattenError(parsedSearch.error),
          })
        }
        const { regionSlug, tableName } = params
        const { apiKey, minlon, minlat, maxlon, maxlat, format } = parsedSearch.data
        console.info(logPrefix, 'start export', {
          regionSlug,
          tableName,
          format,
          bbox: { minlon, minlat, maxlon, maxlat },
          hasApiKey: Boolean(apiKey),
          requestId: request.headers.get('x-request-id') || undefined,
        })

        const status = await resolveRegionAccessStatus({
          headers: request.headers,
          regionSlug,
          apiKey,
        })
        if (status !== 200) {
          console.warn(logPrefix, 'access denied', { status, regionSlug, tableName })
          if (status === 404) {
            return notFoundJson({ headers: corsHeaders })
          }
          return forbiddenJson({ headers: corsHeaders })
        }

        try {
          const tagKeysStartedAt = Date.now()
          const tagKeyQuery: Array<{ key: string }> = await geoDataClient.$queryRawUnsafe(`
              SELECT DISTINCT jsonb_object_keys(tags) AS key
              FROM "${tableName}"
            `)
          const metaKeysStartedAt = Date.now()
          const metaKeyQuery: Array<{ key: string }> = await geoDataClient.$queryRawUnsafe(`
              SELECT DISTINCT jsonb_object_keys(meta) AS key
              FROM "${tableName}"
            `)
          const columnsCheckStartedAt = Date.now()

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
          const columnsMetadataTimingsMs = {
            tagKeys: metaKeysStartedAt - tagKeysStartedAt,
            metaKeys: columnsCheckStartedAt - metaKeysStartedAt,
            columnsCheck: Date.now() - columnsCheckStartedAt,
          }

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

          const ogrStartedAt = Date.now()
          let ogrDurationMs = 0
          await new Promise<void>((resolve, reject) => {
            exec(ogrCommand, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
              ogrDurationMs = Date.now() - ogrStartedAt
              if (error) {
                console.error(logPrefix, 'ogr2ogr failed', {
                  ogrDurationMs,
                  errorMessage: error.message,
                  stderrPreview: stderr ? stderr.slice(0, 4000) : undefined,
                  stdoutPreview: stdout ? stdout.slice(0, 2000) : undefined,
                })
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

          let metadataEditDurationMs = 0
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

            const gdalMetadataStartedAt = Date.now()
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
                        console.warn(logPrefix, 'gdal metadata update failed', {
                          errorMessage: error.message,
                          metadataEditDurationMs: Date.now() - gdalMetadataStartedAt,
                        })
                        await unlinkExportFile(tempMetadataPath, logPrefix, 'gdal_metadata_failed')
                      } else {
                        await fs.unlink(outputFilePath)
                        await fs.rename(tempMetadataPath, outputFilePath)
                        metadataEditDurationMs = Date.now() - gdalMetadataStartedAt
                      }
                    } catch (replaceError) {
                      console.warn(logPrefix, 'gdal metadata replace failed', {
                        replaceError,
                        metadataEditDurationMs: Date.now() - gdalMetadataStartedAt,
                      })
                      await unlinkExportFile(
                        tempMetadataPath,
                        logPrefix,
                        'gdal_metadata_replace_failed',
                      )
                    } finally {
                      resolve()
                    }
                  })()
                },
              )
            })
          }

          const outputStats = await fs.stat(outputFilePath)
          console.info(logPrefix, 'prepared export', {
            outputFilePath,
            outputBytes: outputStats.size,
            tagKeysCount: tagKeyQuery.length,
            metaKeysCount: metaKeyQuery.length,
            hasOsmId,
            hasOsmType,
            columnsMetadataTimingsMs,
            ogrDurationMs,
            metadataEditDurationMs,
            totalDurationMs: Date.now() - requestStartedAt,
          })

          const metadata = await getProcessingMeta()
          const filename = metadata.osm_data_from
            ? `${tableName}_${formatDateBerlin(metadata.osm_data_from, 'yyyy-MM-dd')}.${format}`
            : `${tableName}.${format}`

          console.info(logPrefix, 'starting response stream', {
            filename,
            mimeType: ogrFormat.mimeType,
            contentLength: outputStats.size,
            totalDurationMs: Date.now() - requestStartedAt,
          })

          return new Response(
            createExportFileResponseStream({
              outputFilePath,
              logPrefix,
              requestStartedAt,
            }),
            {
              headers: {
                ...corsHeaders,
                'Content-Type': ogrFormat.mimeType,
                'Content-Length': outputStats.size.toString(),
                'Content-Disposition': `attachment; filename="${filename}"`,
              },
            },
          )
        } catch (error) {
          console.error(logPrefix, 'export failed', {
            regionSlug: params.regionSlug,
            tableName: params.tableName,
            requestUrl: request.url,
            totalDurationMs: Date.now() - requestStartedAt,
            error,
          })
          return internalServerErrorJson({ headers: corsHeaders, cause: error })
        }
      },
    },
  },
})
