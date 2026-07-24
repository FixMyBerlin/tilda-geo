import { $ } from 'bun'

export function databaseUrlToOgrPg(databaseUrl: string) {
  const url = new URL(databaseUrl)
  const port = url.port || '5432'
  const dbname = url.pathname.replace(/^\//, '')
  const params = new URLSearchParams()
  params.set('host', url.hostname)
  params.set('port', port)
  params.set('dbname', dbname)
  params.set('user', decodeURIComponent(url.username))
  if (url.password) {
    params.set('password', decodeURIComponent(url.password))
  }
  return `PG:${params.toString().replace(/&/g, ' ')}`
}

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

export async function getSourceFeatureCount(filePath: string) {
  const layerName = await getFirstLayerName(filePath)
  const result = await $`ogrinfo -so ${filePath} ${layerName}`.quiet().nothrow()
  if (result.exitCode !== 0) {
    throw new Error(result.stderr.toString().trim() || 'ogrinfo failed')
  }
  const stdout = result.stdout.toString()
  const match = stdout.match(/Feature Count:\s*(\d+)/)
  if (!match?.[1]) {
    throw new Error(`Could not read feature count from ogrinfo output for ${filePath}`)
  }
  return Number(match[1])
}

export async function runOgr2ogrImport({
  filePath,
  tableName,
  schema,
  databaseUrl,
  overwrite,
  dryRun,
}: {
  filePath: string
  tableName: string
  schema: string
  databaseUrl: string
  overwrite: boolean
  dryRun: boolean
}) {
  const pg = databaseUrlToOgrPg(databaseUrl)
  const args = [
    'ogr2ogr',
    '-f',
    'PostgreSQL',
    pg,
    filePath,
    '-nln',
    tableName,
    '-lco',
    `SCHEMA=${schema}`,
    '-lco',
    'GEOMETRY_NAME=geom',
    '-lco',
    'FID=id',
    '-t_srs',
    'EPSG:4326',
    '-select',
    'type',
    '-progress',
  ]
  if (overwrite) {
    args.push('-lco', 'OVERWRITE=YES')
  }

  if (dryRun) {
    return { command: args.join(' ') }
  }

  const result = Bun.spawnSync(args, { stdout: 'pipe', stderr: 'pipe' })
  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString()
    const stdout = result.stdout.toString()
    throw new Error(
      [stderr, stdout].filter(Boolean).join('\n') || `ogr2ogr failed (${result.exitCode})`,
    )
  }
  return { command: args.join(' ') }
}
