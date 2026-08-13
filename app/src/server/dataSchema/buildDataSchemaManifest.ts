import type { DataSchemaManifest } from './dataSchemaManifest.schema'
import { dataSchemaManifestSchema } from './dataSchemaManifest.schema'

export type BuildDataSchemaManifestInput = {
  table: string
  publishedAt: string
  snapshotId: string | null
  bytes: number
  sha256: string
  rowCount: number
  publishedBy: string
  publishedFrom: string
  sourceFile?: string
  sourceSha256?: string
  specSha256?: string
}

export function buildDataSchemaManifest(input: BuildDataSchemaManifestInput) {
  return dataSchemaManifestSchema.parse({
    manifestVersion: 1,
    table: input.table,
    publishedAt: input.publishedAt,
    snapshotId: input.snapshotId,
    file: { name: 'table.dump', bytes: input.bytes, sha256: input.sha256 },
    rowCount: input.rowCount,
    provenance: {
      publishedBy: input.publishedBy,
      publishedFrom: input.publishedFrom,
      ...(input.sourceFile ? { sourceFile: input.sourceFile } : {}),
      ...(input.sourceSha256 ? { sourceSha256: input.sourceSha256 } : {}),
      ...(input.specSha256 ? { specSha256: input.specSha256 } : {}),
    },
  } satisfies DataSchemaManifest)
}

export function assertManifestMatchesTable(manifest: { table: string }, table: string) {
  if (manifest.table !== table) {
    throw new Error(
      `Manifest table mismatch: expected "${table}" but manifest.table is "${manifest.table}".`,
    )
  }
}
