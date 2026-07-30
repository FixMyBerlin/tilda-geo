import { z } from 'zod'

type OffsetSearchSchemaOptions = {
  maxTake?: number
}

export const offsetSearchFields = ({ maxTake = 200 }: OffsetSearchSchemaOptions = {}) =>
  ({
    skip: z.coerce.number().int().nonnegative().optional(),
    take: z.coerce.number().int().positive().max(maxTake).optional(),
  }) as const

export const createOffsetSearchSchema = (opts?: OffsetSearchSchemaOptions) =>
  z.object(offsetSearchFields(opts))

export type OffsetSearch = z.infer<ReturnType<typeof createOffsetSearchSchema>>
