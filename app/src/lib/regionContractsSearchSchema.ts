import { z } from 'zod'
import { optionalSearchString } from '@/lib/searchParamsSchema'

export const regionContractsSearchSchema = z.object({
  contract: optionalSearchString(),
})
