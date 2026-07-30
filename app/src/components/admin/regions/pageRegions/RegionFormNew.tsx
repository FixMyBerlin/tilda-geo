import { RegionStatus } from '@/prisma/generated/browser'
import type { TRegionContract } from '@/server/region-contracts/regionContractMapper.server'
import { regionFormEmptyDefaults, RegionForm } from './RegionForm'

type Props = {
  initialSlug?: string
  contracts: TRegionContract[]
}

export function RegionFormNew({ initialSlug, contracts }: Props) {
  return (
    <RegionForm
      mode="create"
      contracts={contracts}
      initialValues={{
        ...regionFormEmptyDefaults,
        slug: initialSlug ?? '',
        status: RegionStatus.PUBLIC,
      }}
    />
  )
}
