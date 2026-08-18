import type { TRegionContract } from '@/server/region-contracts/regionContractMapper.server'
import type { RegionFormInput, RegionWriteInput } from '@/server/regions/regionWriteSchema'
import { regionConfigToFormDefaults, RegionForm } from './RegionForm'

type Props = {
  formConfig: RegionWriteInput
  /** Prefer loader-precomputed values so mask OSM IDs are already strings. */
  formValues?: RegionFormInput
  contracts: TRegionContract[]
  regionId: number
}

export function RegionFormEdit({ formConfig, formValues, contracts, regionId }: Props) {
  const initialValues = formValues ?? regionConfigToFormDefaults(formConfig)
  // Remount when mask defaults change — TanStack Form only reads defaultValues on mount, so after
  // save+invalidate (or reopen) a stale empty mask field would otherwise stick and clear the mask
  // on the next save.
  const formKey = [
    regionId,
    initialValues.maskEnabled,
    initialValues.maskOsmRelationIds,
    initialValues.maskBufferKm,
  ].join(':')

  return (
    <RegionForm
      key={formKey}
      mode="edit"
      initialValues={initialValues}
      contracts={contracts}
      regionId={regionId}
      regionSlug={formConfig.slug}
    />
  )
}
