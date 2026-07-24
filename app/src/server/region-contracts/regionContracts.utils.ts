import type { TRegionContract } from '@/server/region-contracts/regionContractMapper.server'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'

/** UI-only filter param for regions without a contract (not stored in DB). */
export const SINGLETON_CONTRACT_PARAM = '__singleton__' as const

export const UNASSIGNED_CONTRACT_GROUP_LABEL = 'Einzelregion-Aufträge' as const

export function isUnassignedRegion(region: TRegion) {
  return region.contract == null
}

/** Unique contracts from `region.contract` (SQL-joined on getRegions / getRegion). */
export function collectUniqueContractsFromRegions(regions: TRegion[]) {
  const byId = new Map<number, TRegionContract>()
  for (const region of regions) {
    const contract = region.contract
    if (contract) byId.set(contract.id, contract)
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function getMultiRegionContracts(contracts: TRegionContract[]) {
  return contracts.filter((contract) => contract.regionCount > 1)
}

export type RegionContractGroup = {
  contract: TRegionContract | null
  regions: TRegion[]
}

export function groupRegionsByContract(regions: TRegion[]) {
  const groups = new Map<number, TRegion[]>()
  const unassigned: TRegion[] = []

  for (const region of regions) {
    const contract = region.contract
    if (!contract) {
      unassigned.push(region)
      continue
    }
    const list = groups.get(contract.id) ?? []
    list.push(region)
    groups.set(contract.id, list)
  }

  const contractGroups: RegionContractGroup[] = [...groups.entries()]
    .map(([, contractRegions]) => {
      const contract = contractRegions[0]!.contract!
      return {
        contract,
        regions: [...contractRegions].sort((a, b) => a.name.localeCompare(b.name)),
      }
    })
    .sort((a, b) => a.contract!.name.localeCompare(b.contract!.name))

  if (unassigned.length === 0) return contractGroups

  return [
    ...contractGroups,
    {
      contract: null,
      regions: [...unassigned].sort((a, b) => a.name.localeCompare(b.name)),
    },
  ]
}

export function filterRegionsByContractSearch(regions: TRegion[], contractParam: string) {
  if (!contractParam) return regions

  if (contractParam === SINGLETON_CONTRACT_PARAM) {
    return regions.filter(isUnassignedRegion)
  }

  return regions.filter((region) => region.contract?.slug === contractParam)
}
