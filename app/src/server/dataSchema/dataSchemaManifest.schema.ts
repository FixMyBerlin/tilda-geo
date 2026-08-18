import { z } from 'zod'
import { dataSchemaIdentifierSchema } from './dataSchemaSpec.schema'

export const dataSchemaManifestSchema = z.object({
  table: dataSchemaIdentifierSchema,
  sha256: z.hash('sha256'),
  publishedAt: z.iso.datetime(),
  rowCount: z.number().int().nonnegative(),
  snapshotId: z.string().min(1).nullable().optional(),
})

export type DataSchemaManifest = z.infer<typeof dataSchemaManifestSchema>

export function parseDataSchemaManifest(raw: unknown, table: string) {
  const parsed = dataSchemaManifestSchema.safeParse(raw)
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join('; ')
    throw new Error(`Invalid manifest for "${table}": ${detail}`)
  }
  if (parsed.data.table !== table) {
    throw new Error(
      `Manifest table mismatch: expected "${table}" but manifest.table is "${parsed.data.table}".`,
    )
  }
  return parsed.data
}
