import type { DataSchemaManifest } from './dataSchemaManifest.schema'
import { dataSchemaManifestSchema } from './dataSchemaManifest.schema'

export type BuildDataSchemaManifestInput = {
  table: string
  publishedAt: string
  sha256: string
  rowCount: number
  snapshotId?: string | null
}

export function buildDataSchemaManifest(input: BuildDataSchemaManifestInput) {
  return dataSchemaManifestSchema.parse({
    table: input.table,
    sha256: input.sha256,
    publishedAt: input.publishedAt,
    rowCount: input.rowCount,
    snapshotId: input.snapshotId ?? null,
  }) satisfies DataSchemaManifest
}

export function assertManifestMatchesTable(manifest: { table: string }, table: string) {
  if (manifest.table !== table) {
    throw new Error(
      `Manifest table mismatch: expected "${table}" but manifest.table is "${manifest.table}".`,
    )
  }
}
