import { z } from 'zod'
import { dataSchemaIdentifierSchema } from './dataSchemaSpec.schema'

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/, 'Expected 64 lowercase hex chars')

const dataSchemaManifestFields = z.object({
  table: dataSchemaIdentifierSchema,
  sha256: sha256Schema,
  publishedAt: z.string().min(1),
  rowCount: z.number().int().nonnegative(),
  snapshotId: z.string().min(1).nullable().optional(),
})

/** Older publishes nested sha256 under file and added provenance / bytes / manifestVersion. */
function coerceLegacyManifest(raw: unknown) {
  if (!raw || typeof raw !== 'object') return raw
  const value = raw as Record<string, unknown>
  const file = value.file
  const nestedSha =
    file && typeof file === 'object' && file !== null && 'sha256' in file
      ? (file as { sha256: unknown }).sha256
      : undefined
  return {
    table: value.table,
    sha256: typeof value.sha256 === 'string' ? value.sha256 : nestedSha,
    publishedAt: value.publishedAt,
    rowCount: value.rowCount,
    snapshotId: value.snapshotId ?? null,
  }
}

export const dataSchemaManifestSchema = z.preprocess(coerceLegacyManifest, dataSchemaManifestFields)

export type DataSchemaManifest = z.infer<typeof dataSchemaManifestFields>
