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
