import { z } from 'zod'
import { MAX_PAGE_SIZE } from './constants'

/** `skip`/`take` for the REST API and MCP (external contract; admin pages use `createPageSearchSchema`). */
export const offsetSearchFields = () =>
  ({
    skip: z.coerce.number().int().nonnegative().optional(),
    take: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).optional(),
  }) as const

export const createOffsetSearchSchema = () => z.object(offsetSearchFields())
