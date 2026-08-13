import { z } from 'zod'

export const dataSchemaIdentifierRegex = /^[a-z][a-z0-9_]*$/

const identifierSchema = z
  .string()
  .regex(dataSchemaIdentifierRegex, 'Must be lowercase snake_case starting with a letter')
  // Postgres identifiers are capped at 63 bytes (NAMEDATALEN-1).
  .max(63)

const dataSchemaSpecSchema = z.object({
  specVersion: z.literal(1),
  table: identifierSchema,
  source: z.object({
    file: z.string().min(1),
    provider: z.string().min(1).optional(),
    note: z.string().min(1).optional(),
  }),
  import: z.object({
    srid: z.number().int().positive(),
    geometryName: identifierSchema,
    fidColumn: identifierSchema,
    selectColumns: z.array(identifierSchema).nullish(),
    expectedGeometryType: z.string().min(1),
    layer: z.string().min(1).nullish(),
  }),
  indexes: z.array(
    z.object({
      name: identifierSchema,
      using: z.enum(['gist', 'btree']),
      columns: z.array(identifierSchema).min(1),
    }),
  ),
  consumedBy: z.string().min(1).optional(),
  large: z.boolean().default(false),
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
