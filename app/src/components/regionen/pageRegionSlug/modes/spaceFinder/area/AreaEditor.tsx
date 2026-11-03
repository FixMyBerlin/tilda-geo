import { useQueryClient } from '@tanstack/react-query'
import { twJoin } from 'tailwind-merge'
import { fieldErrorClass } from '@/components/shared/form/fields/sharedStyles'
import { Form } from '@/components/shared/form/Form'
import { getErrorMessage } from '@/components/shared/toast/toastError'
import { updateSpaceFinderAreaFn } from '@/server/spaceFinder/spaceFinder.functions'
import {
  SpaceFinderAreaFormSchema,
  type SpaceFinderAreaFormValues,
  type SpaceFinderUseCase,
} from '@/server/spaceFinder/spaceFinderFormSchemas'
import {
  spaceFinderAreaQueryOptions,
  spaceFinderAreasQueryOptions,
  spaceFinderVariantQueryOptions,
} from '@/server/spaceFinder/spaceFinderQueryOptions'
import { useRegionSlug } from '../../../regionUtils/useRegionSlug'
import { ModeFormSubmit } from '../../ModeFormSubmit'
import type { SpaceFinderAreaVariantRow } from '../collection/spaceFinderCollectionOptions'
import type { SpaceFinderVariantDetail } from '../spaceFinderVariantDetail'
import { AreaFormFields } from './AreaFormFields'
import type { StudyAreaGeometry } from './extractStudyAreaGeometry'

type EditorArea = SpaceFinderVariantDetail['area']

const jsonEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Do the changes outdate existing results? Same rule as `updateSpaceFinderAreaFn` on the server. */
const areaInputsChanged = (values: SpaceFinderAreaFormValues, saved: SpaceFinderAreaFormValues) =>
  (values.studyArea != null && !jsonEqual(values.studyArea, saved.studyArea)) ||
  !jsonEqual(values.userDatasets, saved.userDatasets) ||
  values.useCase !== saved.useCase ||
  values.areaSizeM2 !== saved.areaSizeM2

const AreaEditorForm = ({
  area,
  variants,
  onClose,
}: {
  /** Full Gebiet from the open variant. The areas list does not carry geometry or own data. */
  area: EditorArea
  variants: SpaceFinderAreaVariantRow[]
  onClose: () => void
}) => {
  const regionSlug = useRegionSlug()
  const queryClient = useQueryClient()
  const originalStudyArea = area.studyArea as unknown as StudyAreaGeometry
  const savedValues: SpaceFinderAreaFormValues = {
    title: area.title,
    studyArea: originalStudyArea,
    userDatasets: area.userDatasets,
    useCase: (area.useCase as SpaceFinderUseCase) ?? 'fahrradbox',
    areaSizeM2: area.areaSizeM2,
  }
  const hasCompleteRuns = variants.some((v) => v.runs[0]?.status === 'COMPLETE')

  return (
    <Form
      className="flex flex-col space-y-0 text-sm"
      actionBarPlacement="none"
      showFormErrors={false}
      schema={SpaceFinderAreaFormSchema}
      defaultValues={savedValues}
      onSubmit={async (values) => {
        try {
          await updateSpaceFinderAreaFn({
            data: {
              areaId: area.id,
              title: values.title.trim(),
              studyArea: values.studyArea,
              userDatasets: values.userDatasets.map((dataset) => ({
                ...dataset,
                name: dataset.name.trim(),
              })),
              useCase: values.useCase,
              areaSizeM2: values.areaSizeM2,
            },
          })
        } catch (error) {
          return {
            success: false,
            message: getErrorMessage(error, 'Planungsgebiet konnte nicht gespeichert werden.'),
          }
        }
        queryClient.invalidateQueries(spaceFinderAreasQueryOptions(regionSlug))
        queryClient.invalidateQueries(spaceFinderAreaQueryOptions(area.id))
        for (const v of variants) {
          queryClient.invalidateQueries(spaceFinderVariantQueryOptions(v.id))
        }
        onClose()
        return { success: true, message: 'Planungsgebiet gespeichert.' }
      }}
    >
      {(form, { submitError }) => (
        <>
          {hasCompleteRuns && (
            <form.Subscribe selector={(state) => areaInputsChanged(state.values, savedValues)}>
              {(changed) =>
                changed && (
                  <p className="mx-3 mt-3 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                    Änderungen am Planungsgebiet (Gebiet, eigene Daten, Art oder Größe) markieren
                    bestehende Ergebnisse als veraltet. Bitte betroffene Varianten neu berechnen.
                  </p>
                )
              }
            </form.Subscribe>
          )}

          <AreaFormFields
            form={form}
            geometryStepTitle="Geometrie"
            originalStudyArea={originalStudyArea}
            editGeometryOnOpen
          />

          {submitError && (
            <p role="alert" className={twJoin(fieldErrorClass, 'mt-0 px-3 pb-2')}>
              {submitError}
            </p>
          )}
          <div className="px-3 pb-3">
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <ModeFormSubmit
                  label="Speichern"
                  pending={isSubmitting}
                  cancel={{ onClick: onClose }}
                />
              )}
            </form.Subscribe>
          </div>
        </>
      )}
    </Form>
  )
}

/** Edit an existing planungsgebiet: geometry, name, use-case/size, and user obstacles. */
export const AreaEditor = ({
  area,
  variants,
  onClose,
}: {
  area: EditorArea
  variants: SpaceFinderAreaVariantRow[]
  onClose: () => void
}) => <AreaEditorForm key={area.id} area={area} variants={variants} onClose={onClose} />
