import { z } from 'zod'
import { optionalSearchString } from '@/lib/searchParamsSchema'

export const staticDatasetCategoriesSearchSchema = z.object({
  groupKey: optionalSearchString(),
})

export type StaticDatasetCategoriesSearch = {
  groupKey: string | undefined
}
