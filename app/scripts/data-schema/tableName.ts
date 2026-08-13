import { z } from 'zod'
import { dataSchemaIdentifierRegex } from '@/server/dataSchema/dataSchemaSpec.schema'

export const tableNameSchema = z
  .string()
  .trim()
  .min(1)
  .regex(dataSchemaIdentifierRegex, 'Table name must be lowercase snake_case')
