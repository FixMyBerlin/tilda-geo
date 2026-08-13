import * as p from '@clack/prompts'
import { $ } from 'bun'
import type { DataSchemaSpec } from '@/server/dataSchema/dataSchemaSpec.schema'
import {
  databaseUrlToOgrPg,
  gdalVersionMeetsMinimum,
  MIN_GDAL_VERSION,
  parseGdalVersion,
} from './ogrHelpers'

export async function assertGdalPresent() {
  const result = await $`ogr2ogr --version`.quiet().nothrow()
  if (result.exitCode !== 0) {
    p.note(
      'macOS: brew install gdal\nNot required for bun run dev / the map — only data-schema-load, local /api/export, and static-dataset GeoJSON prep.',
      'Install GDAL',
    )
    throw new Error(`ogr2ogr not found (need GDAL ${MIN_GDAL_VERSION}+).`)
  }

  const versionText = `${result.stdout.toString()}\n${result.stderr.toString()}`
  const version = parseGdalVersion(versionText)
  if (!version || !gdalVersionMeetsMinimum(version)) {
    const found = version ? `${version.major}.${version.minor}` : 'unknown'
    p.note('macOS: brew upgrade gdal', 'Upgrade GDAL')
    throw new Error(`GDAL ${found} is too old (need ${MIN_GDAL_VERSION}+).`)
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
