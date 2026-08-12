import { $ } from 'bun'
import type { DataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'
import { databaseUrlToOgrPg } from './ogrHelpers'

export async function assertOgrToolsPresent() {
  for (const bin of ['ogr2ogr', 'ogrinfo']) {
    const result = await $`which ${bin}`.quiet().nothrow()
    if (result.exitCode !== 0) {
      throw new Error(`Missing ${bin} on PATH (install GDAL).`)
    }
  }
}

async function getFirstLayerName(filePath: string) {
  const result = await $`ogrinfo -so ${filePath}`.quiet().nothrow()
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString().trim() || 'ogrinfo failed')
  }
  const layerMatch = result.stdout.toString().match(/^\d+:\s+(\S+)/m)
  if (!layerMatch?.[1]) {
    throw new Error(`Could not detect layer name in ${filePath}`)
  }
  return layerMatch[1]
}

export async function getSourceLayerInfo(filePath: string, layer: string | null | undefined) {
  const layerName = layer?.trim() || (await getFirstLayerName(filePath))
  const result = await $`ogrinfo -so ${filePath} ${layerName}`.quiet().nothrow()
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString().trim() || 'ogrinfo failed')
  }
  const stdout = result.stdout.toString()
  const countMatch = stdout.match(/Feature Count:\s*(\d+)/)
  if (!countMatch?.[1]) {
    throw new Error(`Could not read feature count from ogrinfo output for ${filePath}`)
  }
  const geometryMatch = stdout.match(/^Geometry:\s*(.+)$/m)
  if (!geometryMatch?.[1]) {
    throw new Error(`Could not read geometry type from ogrinfo output for ${filePath}`)
  }
  return {
    layerName,
    featureCount: Number(countMatch[1]),
    geometryType: geometryMatch[1].trim(),
  }
}

export async function runOgr2ogrImport({
  filePath,
  spec,
  databaseUrl,
}: {
  filePath: string
  spec: DataSchemaSpec
  databaseUrl: string
}) {
  const pg = databaseUrlToOgrPg(databaseUrl)
  const { import: importOpts, table } = spec
  const args = [
    'ogr2ogr',
    '-f',
    'PostgreSQL',
    pg,
    filePath,
    '-nln',
    table,
    '-lco',
    'SCHEMA=data',
    '-lco',
    `GEOMETRY_NAME=${importOpts.geometryName}`,
    '-lco',
    `FID=${importOpts.fidColumn}`,
    '-lco',
    'OVERWRITE=YES',
    '-lco',
    'SPATIAL_INDEX=YES',
    '-t_srs',
    `EPSG:${importOpts.srid}`,
    '-progress',
  ]
  if (importOpts.selectColumns && importOpts.selectColumns.length > 0) {
    args.push('-select', importOpts.selectColumns.join(','))
  }
  if (importOpts.layer) {
    args.push(importOpts.layer)
  }

  const result = Bun.spawnSync(args, { stdout: 'pipe', stderr: 'pipe' })
  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString()
    const stdout = result.stdout.toString()
    throw new Error(
      [stderr, stdout].filter(Boolean).join('\n') || `ogr2ogr failed (${result.exitCode})`,
    )
  }
  const safeArgs = args.map((a) => (a.startsWith('PG:') ? 'PG:…' : a))
  return { command: safeArgs.join(' ') }
}
