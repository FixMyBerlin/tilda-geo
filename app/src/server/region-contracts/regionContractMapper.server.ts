import type { RegionContract, RegionContractStatus } from '@/prisma/generated/client'
import type { RegionContractConfigInput } from '@/server/region-contracts/regionContractSchema'

export type TRegionContract = {
  id: number
  slug: string
  name: string
  status: RegionContractStatus
  regionCount: number
}

export type TRegionContractDetail = TRegionContract & {
  regionSlugs: string[]
}

type RegionContractWithCount = RegionContract & {
  _count: { regions: number }
}

type RegionContractWithRegions = RegionContract & {
  regions: { slug: string }[]
  _count: { regions: number }
}

export function regionContractRowToClient(contract: RegionContractWithCount): TRegionContract {
  return {
    id: contract.id,
    slug: contract.slug,
    name: contract.name,
    status: contract.status,
    regionCount: contract._count.regions,
  }
}

export function regionContractRowToDetail(
  contract: RegionContractWithRegions,
): TRegionContractDetail {
  return {
    ...regionContractRowToClient(contract),
    regionSlugs: contract.regions.map((r) => r.slug).sort((a, b) => a.localeCompare(b)),
  }
}

export function regionContractConfigToCreateData(config: RegionContractConfigInput) {
  return {
    slug: config.slug,
    name: config.name,
    status: config.status,
    regions: { connect: config.regionSlugs.map((slug) => ({ slug })) },
  }
}

export function regionContractConfigToUpdateData(config: RegionContractConfigInput) {
  return {
    name: config.name,
    status: config.status,
    regions: { set: config.regionSlugs.map((slug) => ({ slug })) },
  }
}

export const regionContractInclude = {
  _count: { select: { regions: true } },
} as const

export const regionContractDetailInclude = {
  regions: { select: { slug: true }, orderBy: { slug: 'asc' as const } },
  _count: { select: { regions: true } },
} as const
