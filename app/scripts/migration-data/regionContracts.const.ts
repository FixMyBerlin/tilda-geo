type RegionContractStatus = 'active' | 'inactive'

type RegionContractSlug = 'brandenburg'

export type RegionContract = {
  slug: RegionContractSlug
  name: string
  status: RegionContractStatus
  regionSlugs: readonly [string, ...string[]]
}

/** Multi-region Aufträge only — single regions stay unassigned (contractId null). */
export const regionContracts: RegionContract[] = [
  {
    slug: 'brandenburg',
    name: 'Brandenburg',
    status: 'active',
    regionSlugs: ['bb-sg', 'bb-pg', 'bb-kampagne', 'bb-beteiligung'],
  },
]
