import { useQueryClient } from '@tanstack/react-query'
import { twJoin } from 'tailwind-merge'
import { fieldErrorClass } from '@/components/shared/form/fields/sharedStyles'
import { Form } from '@/components/shared/form/Form'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { getErrorMessage } from '@/components/shared/toast/toastError'
import { createPlanningAreaFn } from '@/server/planning/planning.functions'
import {
  PlanningAreaFormSchema,
  type PlanningAreaFormValues,
} from '@/server/planning/planningFormSchemas'
import {
  planningAreaQueryOptions,
  planningAreasQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { useRegionSlug } from '../../../regionUtils/useRegionSlug'
import { ModeFormSubmit } from '../../ModeFormSubmit'
import { DEFAULT_FACTOR_TEMPLATE } from '../factors/spaceFinderDefaults'
import { AreaFormFields } from './AreaFormFields'

const emptyValues: PlanningAreaFormValues = {
  title: '',
  studyArea: null,
  userDatasets: [],
  useCase: 'fahrradbox',
  areaSizeM2: 2,
}

/** Reduced wizard: name + geometry + eigene Daten. Creates area + first variant (no auto-run). */
export const AreaWizard = ({
  onCreated,
  onCancel,
}: {
  onCreated: (areaId: number, variantId: number) => void
  onCancel: () => void
}) => {
  const regionSlug = useRegionSlug()
  const queryClient = useQueryClient()

  return (
    <Form
      className="flex flex-col space-y-0"
      actionBarPlacement="none"
      showFormErrors={false}
      schema={PlanningAreaFormSchema}
      defaultValues={emptyValues}
      onSubmit={async (values) => {
        const title = values.title.trim()
        try {
          const created = await createPlanningAreaFn({
            data: {
              regionSlug,
              title,
              studyArea: values.studyArea,
              userDatasets: values.userDatasets.map((dataset) => ({
                ...dataset,
                name: dataset.name.trim(),
              })),
              useCase: values.useCase,
              areaSizeM2: values.areaSizeM2,
              // The chosen area size prefills the area search of the first variant;
              // after that it can be changed freely per variant.
              factorConfig: { ...DEFAULT_FACTOR_TEMPLATE, min_area_m2: values.areaSizeM2 },
            },
          })
          // Wait for the refetch: selecting the new variant while the area list is still the old
          // one looks like an orphaned key, and the page's auto-select would jump to the first Gebiet.
          await Promise.all([
            queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug)),
            queryClient.invalidateQueries(planningAreaQueryOptions(created.areaId)),
            queryClient.invalidateQueries(planningVariantQueryOptions(created.variantId)),
          ])
          onCreated(created.areaId, created.variantId)
          return { success: true, message: `Planungsgebiet ${frenchQuote(title)} angelegt.` }
        } catch (error) {
          return {
            success: false,
            message: getErrorMessage(error, 'Planungsgebiet konnte nicht angelegt werden.'),
          }
        }
      }}
    >
      {(form, { submitError }) => (
        <>
          <AreaFormFields form={form} />
          {submitError && (
            <p role="alert" className={twJoin(fieldErrorClass, 'mt-0 px-3 pb-2')}>
              {submitError}
            </p>
          )}
          <div className="px-3 pb-3">
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <ModeFormSubmit
                  label="Anlegen"
                  pending={isSubmitting}
                  cancel={{ onClick: onCancel }}
                />
              )}
            </form.Subscribe>
          </div>
        </>
      )}
    </Form>
  )
}
