import { useRouter } from '@tanstack/react-router'
import { twJoin } from 'tailwind-merge'
import { AdminFormLayout, type AdminFormPageExtras } from '@/components/admin/aside/AdminFormLayout'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { ChoiceCheckbox } from '@/components/shared/form/fields/ChoiceCheckbox'
import { choiceOptionListClassName } from '@/components/shared/form/fields/sharedStyles'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form, type SubmitResult } from '@/components/shared/form/Form'
import {
  groupRegionsByContract,
  SINGLETON_CONTRACT_PARAM,
  UNASSIGNED_CONTRACT_GROUP_LABEL,
} from '@/server/region-contracts/regionContracts.utils'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { updateReviewListForAdminFn } from '@/server/review-lists/review-lists.functions'
import { type ReviewListFormInput, UpdateReviewListFormSchema } from '@/server/review-lists/schemas'
import { regionsWithSelectedFirst } from './regionsWithSelectedFirst'

/** Section ids (jump list + URL hash) and titles of the field groups, in page order. */
const sectionLabels = {
  list: 'Prüfliste',
  regions: 'Regionen',
} satisfies Record<string, string>

type Props = {
  listId: number
  initialValues: ReviewListFormInput
  regions: TRegion[]
  pageExtras: AdminFormPageExtras
}

/** Edit-only — lists are created in the region's Prüflisten mode. */
export function ReviewListForm({ listId, initialValues, regions, pageExtras }: Props) {
  const router = useRouter()

  return (
    <Form<ReviewListFormInput>
      actionBarPlacement="none"
      defaultValues={initialValues}
      schema={UpdateReviewListFormSchema}
      onSubmit={async (values) => {
        const result = await updateReviewListForAdminFn({ data: { id: listId, ...values } })
        if (result.success) {
          await router.invalidate()
          return { success: true }
        }
        return result as SubmitResult<ReviewListFormInput>
      }}
    >
      {(form, { submitError }) => (
        <AdminFormLayout
          fieldLabels={sectionLabels}
          extras={pageExtras}
          form={form}
          submitLabel="Speichern"
          cancel={{ to: '/admin/review-lists' }}
          submitError={submitError}
        >
          <AdminFormSection id="list" title={sectionLabels.list}>
            <TextField
              form={form}
              name="name"
              label="Name"
              help="Anzeigename der Prüfliste (z.B. 'Problematische Kreuzungen 2026')"
            />
          </AdminFormSection>

          <AdminFormSection
            id="regions"
            title={sectionLabels.regions}
            description="Prüflisten können mehreren Regionen zugeordnet werden. Das ist beispielsweise hilfreich, wenn für einen Auftrag mehrere Regionen mit unterschiedlichen Daten und Nutzer-Gruppen (Freigaben) erstellt werden."
          >
            <form.Field name="regionSlugs" defaultValue={initialValues.regionSlugs}>
              {(field) => {
                const selectedSlugs = field.state.value ?? []
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
                        const groupTitleId = `review-list-region-group-${groupKey}-title`
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
                            {regionsWithSelectedFirst(contractRegions, selectedSlugs).map(
                              (region) => {
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
                                      field.handleChange(next)
                                    }}
                                  />
                                )
                              },
                            )}
                          </section>
                        )
                      })}
                    </div>
                  </div>
                )
              }}
            </form.Field>
          </AdminFormSection>
        </AdminFormLayout>
      )}
    </Form>
  )
}
