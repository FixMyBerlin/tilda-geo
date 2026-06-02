import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { z } from 'zod'

export const SCHEMA = 'data'
export const SCRIPT_DIR = import.meta.dir
export const DEFAULT_OUTPUT_DIR = resolve(SCRIPT_DIR, 'data')

const tableNameSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z][a-z0-9_]*$/, 'Table name must be lowercase snake_case')

const parsedSchema = z.object({
  file: z.string().optional(),
  table: tableNameSchema.optional(),
  replace: z.boolean(),
  create: z.boolean(),
  yes: z.boolean(),
  noExport: z.boolean(),
  outputDir: z.string().optional(),
  dryRun: z.boolean(),
  help: z.boolean(),
})

export type CliOptions = z.infer<typeof parsedSchema> & {
  filePath?: string
  tableName?: string
  qualifiedTable?: string
}

export function parseCliArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      file: { type: 'string' },
      table: { type: 'string' },
      replace: { type: 'boolean', default: false },
      create: { type: 'boolean', default: false },
      yes: { type: 'boolean', short: 'y', default: false },
      'no-export': { type: 'boolean', default: false },
      'output-dir': { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: true,
  })

  return parsedSchema.parse({
    file: values.file,
    table: values.table,
    replace: values.replace,
    create: values.create,
    yes: values.yes,
    noExport: values['no-export'],
    outputDir: values['output-dir'],
    dryRun: values['dry-run'],
    help: values.help,
  })
}

export function suggestTableFromFile(filePath: string) {
  const base = basename(filePath).replace(/\.(geojson|json|gpkg)$/i, '')
  const result = tableNameSchema.safeParse(base)
  return result.success ? result.data : undefined
}

export function resolveFilePath(file: string) {
  const filePath = resolve(file)
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  return filePath
}

export function qualifiedTableName(tableName: string) {
  return `${SCHEMA}.${tableName}`
}

export function printHelp() {
  process.stdout
    .write(`parking-cutouts-import — load external cutout GeoJSON into data.* and export SQL for production

Usage (from app/):
  bun --env-file=../.env ./scripts/parking-cutouts-import/index.ts [options]

Examples:
  bun --env-file=../.env ./scripts/parking-cutouts-import/index.ts \\
    --file ~/Downloads/.../euvm_cutouts_point.geojson \\
    --table euvm_cutouts_point \\
    --replace

  bun --env-file=../.env ./scripts/parking-cutouts-import/index.ts \\
    --file ~/Downloads/.../euvm_cutouts_polygon.geojson \\
    --table euvm_cutouts_polygon \\
    --replace

Options:
  --file <path>       GeoJSON (or GeoPackage) source file
  --table <name>      Table name without schema (prefixed with data.)
  --replace           Table exists: replace via ogr2ogr OVERWRITE (no prompt)
  --create            Table missing: create and load (no prompt)
  -y, --yes           Same as --replace when table exists
  --no-export         Skip writing production .sql file
  --output-dir <dir>  SQL output directory (default: scripts/parking-cutouts-import/data)
  --dry-run           Print planned steps only
  -h, --help          This message

Requires: ogr2ogr, ogrinfo, Docker (for psql/pg_dump). ENVIRONMENT=development.
`)
}
