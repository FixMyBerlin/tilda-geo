import { z } from 'zod'

export const dataSchemaIdentifierRegex = /^[a-z][a-z0-9_]*$/

const identifierSchema = z
  .string()
  .regex(dataSchemaIdentifierRegex, 'Must be lowercase snake_case starting with a letter')
  // Postgres identifiers are capped at 63 bytes (NAMEDATALEN-1).
  .max(63)

export const dataSchemaSpecSchema = z.object({
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
