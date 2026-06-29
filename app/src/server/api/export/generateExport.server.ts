import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getExportAttributeType } from '@/server/api/export/exportAttributeType'
import { type Formats, ogrFormats } from '@/server/api/export/ogrFormats.const'
import { getBaseDatabaseUrl } from '@/server/database-url.server'
import { geoDataClient } from '@/server/prisma-client.server'

// Embedded into the output layer via ogr2ogr `-mo` (replaces the former, slow
// post-processing pass that rewrote the whole file just to add these fields).
const exportMetadata = {
  licence: 'ODbL',
  attribution: '(c) OpenStreetMap; tilda-geo.de',
  owner: 'FixMyCity GmbH / TILDA Geo',
}

export type GenerateExportInput = {
  tableName: string
  regionSlug: string
  format: Formats
  bbox: { minlon: number; minlat: number; maxlon: number; maxlat: number }
  logPrefix: string
  /** Called with 0..100 as ogr2ogr reports progress. */
  onProgress?: (percent: number) => void
}

export type GenerateExportResult = {
  outputFilePath: string
  outputBytes: number
  mimeType: string
}

const sanitizeKey = (key: string) => key.replace(/[^a-z]/gi, '_')

/**
 * Builds the export file on disk via ogr2ogr and resolves once the file is ready.
 * Reports progress in real time by parsing ogr2ogr's `-progress` output (`0...10...100`).
 */
export async function generateExport({
  tableName,
  regionSlug,
  format,
  bbox,
  logPrefix,
  onProgress,
}: GenerateExportInput): Promise<GenerateExportResult> {
  const { minlon, minlat, maxlon, maxlat } = bbox

  // Discover the columns to export from the table's `tags`/`meta` jsonb keys.
  const tagKeyQuery: Array<{ key: string }> = await geoDataClient.$queryRawUnsafe(`
      SELECT DISTINCT jsonb_object_keys(tags) AS key
      FROM "${tableName}"
    `)
  const metaKeyQuery: Array<{ key: string }> = await geoDataClient.$queryRawUnsafe(`
      SELECT DISTINCT jsonb_object_keys(meta) AS key
      FROM "${tableName}"
    `)
  const columnExistsQuery: Array<{ column_name: string }> = await geoDataClient.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = '${tableName}'
      AND column_name IN ('osm_id', 'osm_type')
    `)
  const existingColumns = columnExistsQuery.map(({ column_name }) => column_name)
  const hasOsmId = existingColumns.includes('osm_id')
  const hasOsmType = existingColumns.includes('osm_type')

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

  // Passed verbatim to ogr2ogr via spawn (no shell), so identifier quotes need no escaping.
  const sqlQuery = `
    SELECT ${columns}
    FROM public."${tableName}"
    WHERE geom && ST_Transform(
      (SELECT ST_SetSRID(ST_MakeEnvelope(${minlon}, ${minlat}, ${maxlon}, ${maxlat}), 4326)),
      3857
    )
  `

  const ogrFormat = ogrFormats[format]
  const outputDir = path.resolve('public', 'temp')
  await fs.mkdir(outputDir, { recursive: true })
  const outputFilePath = path.join(outputDir, `export-temp-${Date.now()}.${format}`)
  const layerName = regionSlug && regionSlug !== 'noRegion' ? regionSlug : undefined

  const metadataArgs = Object.entries(exportMetadata).flatMap(([key, value]) => [
    '-mo',
    `${key}=${value}`,
  ])

  // Export output is WGS84 (GeoJSON RFC 7946; public API contract).
  const ogrArgs = [
    '-f',
    ogrFormat.driver,
    '-t_srs',
    'EPSG:4326',
    '-lco',
    'COORDINATE_PRECISION=8',
    '-progress',
    ...metadataArgs,
    '-sql',
    sqlQuery,
    ...(layerName ? ['-nln', layerName] : []),
    outputFilePath,
    `PG:${getBaseDatabaseUrl()}`,
  ]

  const ogrStartedAt = Date.now()
  await new Promise<void>((resolve, reject) => {
    const child = spawn('ogr2ogr', ogrArgs)
    let lastPercent = 0
    let stderr = ''

    // ogr2ogr `-progress` writes `0...10...20...100 - done.` to stdout incrementally.
    child.stdout.on('data', (chunk: Buffer) => {
      const matches = chunk.toString().match(/\d+/g)
      if (!matches) return
      const percent = Math.min(100, Math.max(...matches.map(Number)))
      if (percent > lastPercent) {
        lastPercent = percent
        onProgress?.(percent)
      }
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', (error) => reject(error))
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      console.error(logPrefix, 'ogr2ogr failed', {
        code,
        ogrDurationMs: Date.now() - ogrStartedAt,
        stderrPreview: stderr.slice(0, 4000),
      })
      reject(new Error(`ogr2ogr exited with code ${code}: ${stderr.slice(0, 500)}`))
    })
  })

  const outputStats = await fs.stat(outputFilePath)
  console.info(logPrefix, 'prepared export', {
    outputFilePath,
    outputBytes: outputStats.size,
    tagKeysCount: tagKeyQuery.length,
    metaKeysCount: metaKeyQuery.length,
    hasOsmId,
    hasOsmType,
    ogrDurationMs: Date.now() - ogrStartedAt,
  })

  return {
    outputFilePath,
    outputBytes: outputStats.size,
    mimeType: ogrFormat.mimeType,
  }
}
