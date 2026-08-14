import { basename } from 'node:path'
import { z } from 'zod'

export const dataSchemaIdentifierRegex = /^[a-z][a-z0-9_]*$/

export const dataSchemaIdentifierSchema = z
  .string()
  .regex(dataSchemaIdentifierRegex, 'Must be lowercase snake_case starting with a letter')
  // Postgres identifiers are capped at 63 bytes (NAMEDATALEN-1).
  .max(63)

export function isDataSchemaSourceBasename(sourceFile: string) {
  return basename(sourceFile) === sourceFile && sourceFile !== '.' && sourceFile !== '..'
}

const dataSchemaSpecSchema = z.object({
  specVersion: z.literal(1),
  table: dataSchemaIdentifierSchema,
  source: z.object({
    file: z
      .string()
      .min(1)
      .refine(isDataSchemaSourceBasename, 'source.file must be a basename (no path separators)'),
    provider: z.string().min(1).optional(),
    documentation: z.string().min(1).optional(),
  }),
  import: z.object({
    srid: z.number().int().positive(),
    geometryName: dataSchemaIdentifierSchema,
    fidColumn: dataSchemaIdentifierSchema,
    selectColumns: z.array(dataSchemaIdentifierSchema).nullish(),
    expectedGeometryType: z.string().min(1),
    layer: z.string().min(1).nullish(),
  }),
  indexes: z.array(
    z.object({
      name: dataSchemaIdentifierSchema,
      using: z.enum(['gist', 'btree']),
      columns: z.array(dataSchemaIdentifierSchema).min(1),
    }),
  ),
  consumedBy: z.string().min(1).optional(),
})

export type DataSchemaSpec = z.infer<typeof dataSchemaSpecSchema>

export function parseDataSchemaSpec(raw: unknown, table: string) {
  const parsed = dataSchemaSpecSchema.safeParse(raw)
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join('; ')
    throw new Error(`Invalid spec for "${table}": ${detail}`)
  }
  if (parsed.data.table !== table) {
    throw new Error(
      `Spec table mismatch: expected "${table}" but spec.table is "${parsed.data.table}".`,
    )
  }
  return parsed.data
}
