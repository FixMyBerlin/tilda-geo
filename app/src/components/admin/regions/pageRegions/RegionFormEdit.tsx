import type { TRegionContract } from '@/server/region-contracts/regionContractMapper.server'
import type { RegionMaskConfig } from '@/server/regions/regionConfigMapper.server'
import type { RegionWriteInput } from '@/server/regions/regionWriteSchema'
import { regionConfigToFormDefaults, RegionForm } from './RegionForm'
import { regionConfigToMaskFormDefaults, RegionMaskForm } from './RegionMaskForm'

type Props = {
  formConfig: RegionWriteInput
  maskConfig: RegionMaskConfig
  contracts: TRegionContract[]
  regionId: number
}

export function RegionFormEdit({ formConfig, maskConfig, contracts, regionId }: Props) {
  return (
    <div className="space-y-10">
      <RegionForm
        mode="edit"
        initialValues={regionConfigToFormDefaults(formConfig)}
        contracts={contracts}
        regionId={regionId}
        regionSlug={formConfig.slug}
      />
      <RegionMaskForm
        regionSlug={formConfig.slug}
        initialValues={regionConfigToMaskFormDefaults(maskConfig)}
      />
    </div>
  )
}
