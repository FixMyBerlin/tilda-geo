import { parseArgs } from 'node:util'
import { z } from 'zod'
import { tableNameSchema } from '../tableName'

export function parseLoadArgs(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      table: { type: 'string' },
      file: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: true,
    strict: true,
  })
  return z
    .object({
      table: tableNameSchema,
      file: z.string().min(1).optional(),
      help: z.boolean(),
    })
    .parse({
      table: values.table,
      file: values.file,
      help: values.help,
    })
}

export function printLoadHelp() {
  process.stdout.write(`data-schema-load — spec.json + source file → local data.<table>

Usage:
  bun run data-schema-load -- --table <name> [--file <path>]

Requires data-schema/<table>/spec.json first (write it, or data-schema-sync).
Local dev computer only. Reads that spec, ogr2ogr into data.<table>, then
verifies row count and creates indexes. --file only overrides the geojson/gpkg
path; columns, SRID, geometry, and indexes still come from the spec.

Does not export or upload — run data-schema-publish after you have checked the table.

Options:
  --table <name>  Selects data-schema/<name>/spec.json (must equal spec.table)
  --file <path>   Override source file (default: data-schema/<table>/<spec.source.file>)
  -h, --help      This message

Requires: GDAL 3.8+ (ogr2ogr, ogrinfo — brew install gdal), Docker, ENVIRONMENT=development.
`)
}
