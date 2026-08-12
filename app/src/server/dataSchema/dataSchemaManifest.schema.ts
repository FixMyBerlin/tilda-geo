import { z } from 'zod'
import { dataSchemaIdentifierRegex } from './dataSchemaSpec.schema'

const identifierSchema = z
  .string()
  .regex(dataSchemaIdentifierRegex, 'Must be lowercase snake_case starting with a letter')

export const dataSchemaManifestSchema = z.object({
  manifestVersion: z.literal(1),
  table: identifierSchema,
  publishedAt: z.string().min(1),
  snapshotId: z.string().min(1).nullable(),
  file: z.object({
    name: z.literal('table.dump'),
    bytes: z.number().int().nonnegative(),
    sha256: z.string().min(1),
  }),
  rowCount: z.number().int().nonnegative(),
  large: z.boolean(),
  pgDumpVersion: z.string().min(1),
  provenance: z.object({
    publishedBy: z.string().min(1),
    publishedFrom: z.string().min(1),
    sourceFile: z.string().min(1).optional(),
    sourceSha256: z.string().min(1).optional(),
    specSha256: z.string().min(1).optional(),
  }),
})

export type DataSchemaManifest = z.infer<typeof dataSchemaManifestSchema>
