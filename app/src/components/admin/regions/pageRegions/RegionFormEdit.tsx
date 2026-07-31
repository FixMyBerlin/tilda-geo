import type { TRegionContract } from '@/server/region-contracts/regionContractMapper.server'
import type { RegionWriteInput } from '@/server/regions/regionWriteSchema'
import { regionConfigToFormDefaults, RegionForm } from './RegionForm'

type Props = {
  formConfig: RegionWriteInput
  contracts: TRegionContract[]
  regionId: number
}

export function RegionFormEdit({ formConfig, contracts, regionId }: Props) {
  return (
    <RegionForm
      mode="edit"
      initialValues={regionConfigToFormDefaults(formConfig)}
      contracts={contracts}
      regionId={regionId}
      regionSlug={formConfig.slug}
    />
  )
}
