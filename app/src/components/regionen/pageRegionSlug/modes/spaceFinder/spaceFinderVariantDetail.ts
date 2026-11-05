import type { getSpaceFinderVariantFn } from '@/server/space-finder/space-finder.functions'

export type SpaceFinderVariantDetail = Awaited<ReturnType<typeof getSpaceFinderVariantFn>>
