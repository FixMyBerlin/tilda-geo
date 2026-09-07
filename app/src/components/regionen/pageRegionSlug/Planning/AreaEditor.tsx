import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { MAX_STUDY_AREA_KM2 } from '@/lib/planningStudyAreaLimit'
import { deletePlanningAreaFn, updatePlanningAreaFn } from '@/server/planning/planning.functions'
import type { getPlanningAreaFn } from '@/server/planning/planning.functions'
import {
  planningAreaQueryOptions,
  planningAreasQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { usePlanningBoundaryState } from '../hooks/mapState/usePlanningBoundaryState'
import { useSetPlanningSelection } from '../hooks/useQueryState/usePlanningParams'
import { AreaFormFields, useEffectiveStudyArea, useStudyAreaKm2 } from './AreaFormFields'
import type { PlanningUseCase } from './planningDefaults'
import type { UserGeojsonMode } from './UserObstaclesField'

type PlanningAreaDetail = Awaited<ReturnType<typeof getPlanningAreaFn>>

const jsonEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

const AreaEditorForm = ({
  area,
  areaId,
  regionSlug,
  onClose,
  onDeleted,
}: {
  area: PlanningAreaDetail
  areaId: number
  regionSlug: string
  onClose: () => void
  onDeleted?: () => void
}) => {
  const queryClient = useQueryClient()
  const setBoundaryHighlightGeom = usePlanningBoundaryState((s) => s.setBoundaryHighlightGeom)
  const setPlanningSelection = useSetPlanningSelection()

  const [title, setTitle] = useState(area.title)
  const [boundaryId, setBoundaryId] = useState<string | null>(null)
  const [studyArea, setStudyArea] = useState<unknown>(area.studyArea)
  const [areaTab, setAreaTab] = useState<'search' | 'custom'>('search')
  const [userGeojson, setUserGeojson] = useState<GeoJSON.FeatureCollection | undefined>(
    (area.userGeojson as GeoJSON.FeatureCollection | null) ?? undefined,
  )
  const [userGeojsonMode, setUserGeojsonMode] = useState<UserGeojsonMode>(
    (area.userGeojsonMode as UserGeojsonMode) ?? 'bonus',
  )
  const [useCase, setUseCase] = useState<PlanningUseCase>(
    (area.useCase as PlanningUseCase) ?? 'fahrradbox',
  )
  const [areaSizeM2, setAreaSizeM2] = useState<number | null>(area.areaSizeM2)
  const [obstaclesDirty, setObstaclesDirty] = useState(false)

  useEffect(() => {
    setBoundaryHighlightGeom(area.studyArea as object, { filled: false })
  }, [area.studyArea, setBoundaryHighlightGeom])

  const effectiveStudyArea = useEffectiveStudyArea(studyArea)
  const areaKm2 = useStudyAreaKm2(effectiveStudyArea)
  const areaTooLarge = areaKm2 != null && areaKm2 > MAX_STUDY_AREA_KM2

  const hasCompleteRuns = area.variants.some((v) => v.runs[0]?.status === 'COMPLETE')
  const geometryDirty = effectiveStudyArea != null && !jsonEqual(effectiveStudyArea, area.studyArea)
  const obstaclesChanged =
    obstaclesDirty ||
    !jsonEqual(userGeojson ?? null, area.userGeojson ?? null) ||
    userGeojsonMode !== ((area.userGeojsonMode as UserGeojsonMode) ?? 'bonus')
  const useCaseChanged =
    useCase !== ((area.useCase as PlanningUseCase) ?? 'fahrradbox') ||
    areaSizeM2 !== area.areaSizeM2

  const mutation = useMutation({
    mutationFn: () =>
      updatePlanningAreaFn({
        data: {
          areaId,
          title,
          studyArea: effectiveStudyArea!,
          userGeojson: userGeojson ?? null,
          userGeojsonMode,
          useCase,
          areaSizeM2,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))
      queryClient.invalidateQueries(planningAreaQueryOptions(areaId))
      for (const v of area.variants) {
        queryClient.invalidateQueries(planningVariantQueryOptions(v.id))
      }
      onClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePlanningAreaFn({ data: { areaId } }),
    onSuccess: () => {
      const areasKey = planningAreasQueryOptions(regionSlug).queryKey
      const previous = queryClient.getQueryData(areasKey) ?? []
      const remaining = previous.filter((a) => a.id !== areaId)
      // Optimistic remove so auto-select cannot resurrect the deleted id.
      queryClient.setQueryData(areasKey, remaining)
      queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))

      const next = remaining[0]
      if (next) {
        const firstVariant = next.variants[0]
        setPlanningSelection({
          area: next.id,
          variant: firstVariant?.id ?? null,
          run: firstVariant?.currentRunId ?? null,
        })
      } else {
        setPlanningSelection({ area: null, variant: null, run: null })
      }
      onDeleted?.()
      onClose()
    },
  })

  return (
    <div className="flex flex-col gap-2 rounded border border-gray-200 p-2.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Planungsgebiet bearbeiten</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Schließen
        </button>
      </div>

      {hasCompleteRuns && (geometryDirty || obstaclesChanged || useCaseChanged) && (
        <p className="rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
          Änderungen am Planungsgebiet (Gebiet, eigene Daten, Art oder Größe) markieren bestehende
          Ergebnisse als veraltet. Bitte betroffene Varianten neu berechnen.
        </p>
      )}

      <AreaFormFields
        regionSlug={regionSlug}
        state={{
          title,
          boundaryId,
          studyArea,
          areaTab,
          userGeojson,
          userGeojsonMode,
          useCase,
          areaSizeM2,
        }}
        onTitleChange={setTitle}
        onBoundaryIdChange={setBoundaryId}
        onStudyAreaChange={setStudyArea}
        onAreaTabChange={setAreaTab}
        onUserGeojsonChange={(geojson) => {
          setUserGeojson(geojson)
          setObstaclesDirty(true)
        }}
        onUserGeojsonModeChange={(mode) => {
          setUserGeojsonMode(mode)
          setObstaclesDirty(true)
        }}
        onUseCaseChange={setUseCase}
        onAreaSizeM2Change={setAreaSizeM2}
        geometryStepTitle="Gebiet überschreiben"
      />

      {mutation.isError && (
        <p className="text-xs text-red-600">{String((mutation.error as Error).message)}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !effectiveStudyArea || areaTooLarge}
          className={twJoin(
            'rounded bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50',
          )}
        >
          {mutation.isPending ? 'Speichern…' : 'Gebiet speichern'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Planungsgebiet und alle Varianten unwiderruflich löschen?')) {
              deleteMutation.mutate()
            }
          }}
          disabled={deleteMutation.isPending}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          Löschen
        </button>
      </div>
    </div>
  )
}

/** Edit an existing planungsgebiet: geometry, name, use-case/size, and user obstacles. */
export const AreaEditor = ({
  areaId,
  regionSlug,
  onClose,
  onDeleted,
}: {
  areaId: number
  regionSlug: string
  onClose: () => void
  onDeleted?: () => void
}) => {
  const { data: area } = useQuery(planningAreaQueryOptions(areaId))

  if (!area) return null

  return (
    <AreaEditorForm
      key={areaId}
      area={area}
      areaId={areaId}
      regionSlug={regionSlug}
      onClose={onClose}
      onDeleted={onDeleted}
    />
  )
}
