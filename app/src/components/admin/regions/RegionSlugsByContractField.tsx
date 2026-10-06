import type { DeepKeys } from '@tanstack/form-core'
import { twJoin } from 'tailwind-merge'
import { ChoiceCheckbox } from '@/components/shared/form/fields/ChoiceCheckbox'
import { choiceOptionListClassName } from '@/components/shared/form/fields/sharedStyles'
import type { FormApi } from '@/components/shared/form/types'
import {
  groupRegionsByContract,
  SINGLETON_CONTRACT_PARAM,
  UNASSIGNED_CONTRACT_GROUP_LABEL,
} from '@/server/region-contracts/regionContracts.utils'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { regionsWithSelectedFirst } from './regionsWithSelectedFirst'

type Props<T extends Record<string, unknown>> = {
  form: FormApi<T>
  name: DeepKeys<T>
  regions: TRegion[]
  /** Prefix for group heading ids, e.g. `note-folder` or `review-list`. */
  idPrefix: string
}

export function RegionSlugsByContractField<T extends Record<string, unknown>>({
  form,
  name,
  regions,
  idPrefix,
}: Props<T>) {
  return (
    <form.Field name={name}>
      {(field) => {
        const selectedSlugs = (field.state.value ?? []) as string[]
        const groups = groupRegionsByContract(regions)
        return (
          <div>
            <p className="mb-2 text-sm text-gray-600">
              {selectedSlugs.length === 0
                ? 'Keine Region ausgewählt.'
                : `Ausgewählt: ${selectedSlugs.join(', ')}`}
            </p>
            <div
              className={twJoin(
                'max-h-64 overflow-y-auto rounded border border-gray-200 p-3',
                'space-y-4',
              )}
            >
              {groups.map(({ contract, regions: contractRegions }) => {
                const groupKey = contract?.slug ?? SINGLETON_CONTRACT_PARAM
                const groupTitleId = `${idPrefix}-region-group-${groupKey}-title`
                return (
                  <section
                    key={groupKey}
                    aria-labelledby={groupTitleId}
                    className={choiceOptionListClassName}
                  >
                    <h3
                      id={groupTitleId}
                      className="text-xs font-semibold tracking-wide text-gray-600 uppercase"
                    >
                      {contract?.name ?? UNASSIGNED_CONTRACT_GROUP_LABEL}
                    </h3>
                    {regionsWithSelectedFirst(contractRegions, selectedSlugs).map((region) => {
                      const checked = selectedSlugs.includes(region.slug)
                      return (
                        <ChoiceCheckbox
                          key={region.slug}
                          id={`region-${region.slug}`}
                          checked={checked}
                          ariaLabel={`${region.name} (${region.slug})`}
                          label={
                            <>
                              {region.name} ({region.slug})
                            </>
                          }
                          onBlur={field.handleBlur}
                          onChange={(nextChecked) => {
                            const next = nextChecked
                              ? [...selectedSlugs, region.slug]
                              : selectedSlugs.filter((slug) => slug !== region.slug)
                            field.handleChange((_prev) => next as typeof _prev)
                          }}
                        />
                      )
                    })}
                  </section>
                )
              })}
            </div>
          </div>
        )
      }}
    </form.Field>
  )
}
