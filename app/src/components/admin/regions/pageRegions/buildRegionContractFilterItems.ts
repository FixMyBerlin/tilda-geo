import { RegionContractStatus } from '@/prisma/generated/browser'
import {
  collectUniqueContractsFromRegions,
  getMultiRegionContracts,
  isUnassignedRegion,
  SINGLETON_CONTRACT_PARAM,
  UNASSIGNED_CONTRACT_GROUP_LABEL,
} from '@/server/region-contracts/regionContracts.utils'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'

export function buildRegionContractFilterItems(regions: TRegion[]) {
  const multi = getMultiRegionContracts(collectUniqueContractsFromRegions(regions))
  const unassignedCount = regions.filter(isUnassignedRegion).length

  const activeMulti = multi.filter((c) => c.status === RegionContractStatus.ACTIVE)
  const inactiveMulti = multi.filter((c) => c.status === RegionContractStatus.INACTIVE)

  const countForContract = (contractId: number) =>
    regions.filter((region) => region.contract?.id === contractId).length

  return [
    { id: '', label: 'Alle', count: regions.length },
    ...activeMulti.map((contract) => ({
      id: contract.slug,
      label: contract.name,
      count: countForContract(contract.id),
    })),
    {
      id: SINGLETON_CONTRACT_PARAM,
      label: UNASSIGNED_CONTRACT_GROUP_LABEL,
      count: unassignedCount,
    },
    ...inactiveMulti.map((contract) => ({
      id: contract.slug,
      label: contract.name,
      count: countForContract(contract.id),
    })),
  ]
}
