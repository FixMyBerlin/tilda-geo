import { z } from 'zod'
import { RegionWelcomeSectionWriteSchema } from '@/server/regions/regionWriteSchema'

export const regionWelcomeSectionsSchema = z.array(RegionWelcomeSectionWriteSchema).max(8)

export function parseRegionWelcomeSections(value: unknown) {
  const parsed = regionWelcomeSectionsSchema.safeParse(value)
  return parsed.success ? [...parsed.data].sort((a, b) => a.sortOrder - b.sortOrder) : []
}
