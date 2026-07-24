import { z } from 'zod'
import { optionalSearchString } from '@/lib/searchParamsSchema'

export const mapDatasetCategoriesSearchSchema = z.object({
  groupKey: optionalSearchString(),
})

export type MapDatasetCategoriesSearch = {
  groupKey: string | undefined
}
