import { RegionContractStatus } from '@/prisma/generated/client'

export type SeedRegionContract = {
  slug: string
  name: string
  status: RegionContractStatus
  regionSlugs: string[]
}

/** Dev/test contracts: multi-region groupings only; unassigned regions keep contractId null. */
export const seedRegionContractCatalog: SeedRegionContract[] = [
  {
    slug: 'multi-parkraum-network',
    name: 'Parkraum + Regionalnetz (Dev)',
    status: RegionContractStatus.ACTIVE,
    regionSlugs: ['dev-template-parkraum-city', 'dev-template-regional-network'],
  },
  {
    slug: 'inactive-contract',
    name: 'Inaktiver Auftrag (Dev)',
    status: RegionContractStatus.INACTIVE,
    regionSlugs: [],
  },
]
