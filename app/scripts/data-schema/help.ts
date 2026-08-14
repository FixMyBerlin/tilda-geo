import { devPortSlotConfigFromEnv } from '../predev/devPortSlot'

/** Shared --help section for every data-schema CLI. */
export function formatDataSchemaBigPictureHelp() {
  const origin = devPortSlotConfigFromEnv().appOrigin
  return `Big picture — new table (local dev computer):
  1. Write spec.json (skill \`/add-db-data-table\`)
  2. \`bun run data-schema-load\` uses the spec + source file to create the local db \`data.*\` table
  3. \`bun run data-schema-publish\` pushes spec + db dump to S3
  4. ${origin}/admin/data-schema to test restoring the dump from S3

Big picture — existing table:
  Staging/production: /admin/data-schema Import (dumps from S3)
  Local dev computer: data-schema-pull (specs from S3); Import for dumps`
}
