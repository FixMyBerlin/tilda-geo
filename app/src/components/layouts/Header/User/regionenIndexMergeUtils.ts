import type { RegionWithAdditionalData } from '@/server/regions/queries/getRegionsWithAdditionalData.server'
import type { getRegionenIndexLoaderFn } from '@/server/regions/regionen.functions'

type RegionenIndexData = Awaited<ReturnType<typeof getRegionenIndexLoaderFn>>

const sortByName = (regions: RegionWithAdditionalData[]) =>
  [...regions].sort((a, b) => a.name.localeCompare(b.name, 'de'))

export const mergeRegionenIndexRegions = (data: RegionenIndexData | undefined) => {
  if (!data) return []

  const bySlug = new Map<string, RegionWithAdditionalData>()
  for (const region of [
    ...data.activeRegions,
    ...data.deactivatedRegions,
    ...data.publicRegions,
    ...data.nonPublicRegions,
  ]) {
    bySlug.set(region.slug, region)
  }

  return sortByName([...bySlug.values()])
}

export const partitionRegionsByStatus = (regions: RegionWithAdditionalData[]) => {
  const active = regions.filter((r) => r.status !== 'DEACTIVATED')
  const deactivated = regions.filter((r) => r.status === 'DEACTIVATED')

  return { active, deactivated } satisfies {
    active: RegionWithAdditionalData[]
    deactivated: RegionWithAdditionalData[]
  }
}

const matchesQuery = (region: RegionWithAdditionalData, query: string) => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  return (
    region.name.toLowerCase().includes(normalized) ||
    region.fullName.toLowerCase().includes(normalized) ||
    region.slug.toLowerCase().includes(normalized)
  )
}

export const filterRegions = (regions: RegionWithAdditionalData[], query: string) =>
  regions.filter((region) => matchesQuery(region, query))

export const filterPartitionedRegions = (
  partitions: ReturnType<typeof partitionRegionsByStatus>,
  query: string,
) => ({
  active: filterRegions(partitions.active, query),
  deactivated: filterRegions(partitions.deactivated, query),
})
