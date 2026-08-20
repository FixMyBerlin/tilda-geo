import { z } from 'zod'
import { dataSchemaIdentifierSchema } from '@/server/dataSchema/dataSchemaSpec.schema'

export const tableNameSchema = z.string().trim().pipe(dataSchemaIdentifierSchema)
