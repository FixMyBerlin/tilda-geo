import type { getSpaceFinderVariantFn } from '@/server/spaceFinder/spaceFinder.functions'

export type SpaceFinderVariantDetail = Awaited<ReturnType<typeof getSpaceFinderVariantFn>>
