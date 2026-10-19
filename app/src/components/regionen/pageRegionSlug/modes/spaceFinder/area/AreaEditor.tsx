import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { MAX_STUDY_AREA_KM2 } from '@/lib/planningStudyAreaLimit'
import type { UserDataset } from '@/lib/planningUserGeojson'
import { updatePlanningAreaFn } from '@/server/planning/planning.functions'
import {
  planningAreaQueryOptions,
  planningAreasQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { useRegionSlug } from '../../../regionUtils/useRegionSlug'
import type { PlanningAreaVariantRow } from '../collection/spaceFinderCollectionOptions'
import type { PlanningUseCase } from '../factors/spaceFinderDefaults'
import type { PlanningVariantDetail } from '../spaceFinderVariantDetail'
import { AreaFormFields, useEffectiveStudyArea, useStudyAreaKm2 } from './AreaFormFields'
import type { StudyAreaGeometry } from './extractStudyAreaGeometry'
import { userDatasetsValid } from './UserDatasetsField'

type EditorArea = PlanningVariantDetail['area']

const jsonEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

const AreaEditorForm = ({
  area,
  variants,
  onClose,
}: {
  /** Full Gebiet from the open variant. The areas list does not carry geometry or own data. */
  area: EditorArea
  variants: PlanningAreaVariantRow[]
  onClose: () => void
}) => {
  const regionSlug = useRegionSlug()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState(area.title)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const titleMissing = submitAttempted && title.trim().length === 0
  const [boundaryId, setBoundaryId] = useState<string | null>(null)
  const [studyArea, setStudyArea] = useState<unknown>(area.studyArea)
  const [areaTab, setAreaTab] = useState<'search' | 'custom'>('custom')
  const [userDatasets, setUserDatasets] = useState<UserDataset[]>(area.userDatasets)
  const [useCase, setUseCase] = useState<PlanningUseCase>(
    (area.useCase as PlanningUseCase) ?? 'fahrradbox',
  )
  const [areaSizeM2, setAreaSizeM2] = useState<number | null>(area.areaSizeM2)

  const effectiveStudyArea = useEffectiveStudyArea(studyArea)
  const areaKm2 = useStudyAreaKm2(effectiveStudyArea)
  const areaTooLarge = areaKm2 != null && areaKm2 > MAX_STUDY_AREA_KM2

  const hasCompleteRuns = variants.some((v) => v.runs[0]?.status === 'COMPLETE')
  const geometryDirty = effectiveStudyArea != null && !jsonEqual(effectiveStudyArea, area.studyArea)
  const obstaclesChanged = !jsonEqual(userDatasets, area.userDatasets)
  const namesValid = userDatasetsValid(userDatasets)
  const useCaseChanged =
    useCase !== ((area.useCase as PlanningUseCase) ?? 'fahrradbox') ||
    areaSizeM2 !== area.areaSizeM2

  const mutation = useMutation({
    mutationFn: () =>
      updatePlanningAreaFn({
        data: {
          areaId: area.id,
          title,
          studyArea: effectiveStudyArea!,
          userDatasets: userDatasets.map((dataset) => ({
            ...dataset,
            name: dataset.name.trim(),
          })),
          useCase,
          areaSizeM2,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))
      queryClient.invalidateQueries(planningAreaQueryOptions(area.id))
      for (const v of variants) {
        queryClient.invalidateQueries(planningVariantQueryOptions(v.id))
      }
      onClose()
    },
  })

  // Like the wizard: show errors only after a save attempt, then mark them at the field.
  const handleSubmit = () => {
    setSubmitAttempted(true)
    if (title.trim().length === 0 || !namesValid) return
    mutation.mutate()
  }

  return (
    <div className="flex flex-col text-sm">
      <div className="flex flex-col">
        {hasCompleteRuns && (geometryDirty || obstaclesChanged || useCaseChanged) && (
          <p className="mx-3 mt-3 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
            Änderungen am Planungsgebiet (Gebiet, eigene Daten, Art oder Größe) markieren bestehende
            Ergebnisse als veraltet. Bitte betroffene Varianten neu berechnen.
          </p>
        )}

        <AreaFormFields
          state={{
            title,
            boundaryId,
            studyArea,
            areaTab,
            userDatasets,
            useCase,
            areaSizeM2,
          }}
          onTitleChange={setTitle}
          onBoundaryIdChange={setBoundaryId}
          onStudyAreaChange={setStudyArea}
          onAreaTabChange={setAreaTab}
          onUserDatasetsChange={setUserDatasets}
          onUseCaseChange={setUseCase}
          onAreaSizeM2Change={setAreaSizeM2}
          geometryStepTitle="Geometrie des Gebiets"
          originalStudyArea={area.studyArea as StudyAreaGeometry | null}
          editGeometryOnOpen
          titleMissing={titleMissing}
          showValidation={submitAttempted}
        />

        {mutation.isError && (
          <p className="px-3 text-xs text-red-600">{String((mutation.error as Error).message)}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-3 pb-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending || !effectiveStudyArea || areaTooLarge}
          className={twJoin(
            'rounded bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50',
          )}
        >
          {mutation.isPending ? 'Speichern…' : 'Gebiet speichern'}
        </button>
      </div>
      {submitAttempted && (title.trim().length === 0 || !namesValid) && (
        <p className="px-3 pb-3 text-xs text-red-600">Alle Felder ausfüllen</p>
      )}
    </div>
  )
}

/** Edit an existing planungsgebiet: geometry, name, use-case/size, and user obstacles. */
export const AreaEditor = ({
  area,
  variants,
  onClose,
}: {
  area: EditorArea
  variants: PlanningAreaVariantRow[]
  onClose: () => void
}) => <AreaEditorForm key={area.id} area={area} variants={variants} onClose={onClose} />
