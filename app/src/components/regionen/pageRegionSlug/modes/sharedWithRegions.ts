import { frenchQuote } from '@/components/shared/text/Quotes'

type LinkedRegion = {
  slug: string
  name: string
}

export const otherRegionNames = (
  regions: readonly LinkedRegion[] | undefined,
  currentSlug: string,
) => regions?.filter((linked) => linked.slug !== currentSlug).map((linked) => linked.name) ?? []

/** Header / picker copy when a folder or list is linked to other regions. */
export const formatSharedWithRegions = (noun: 'Ordner' | 'Liste', names: readonly string[]) => {
  if (names.length === 0) return undefined
  return `${noun} geteilt mit: ${names.map((name) => frenchQuote(name)).join(', ')}`
}

export const sharedWithRegionsSubtitle = (
  noun: 'Ordner' | 'Liste',
  regions: readonly LinkedRegion[] | undefined,
  currentSlug: string,
) => formatSharedWithRegions(noun, otherRegionNames(regions, currentSlug))
