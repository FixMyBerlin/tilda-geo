import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { MAX_STUDY_AREA_KM2 } from '@/lib/planningStudyAreaLimit'
import { createPlanningAreaFn } from '@/server/planning/planning.functions'
import {
  planningAreaQueryOptions,
  planningAreasQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { AreaFormFields, useEffectiveStudyArea, useStudyAreaKm2 } from './AreaFormFields'
import { DEFAULT_FACTOR_TEMPLATE, type PlanningUseCase } from './planningDefaults'
import type { UserGeojsonMode } from './UserObstaclesField'

/** Reduced wizard: name + geometry + eigene Daten. Creates area + first variant (no auto-run). */
export const AreaWizard = ({
  regionSlug,
  onCreated,
  onCancel,
}: {
  regionSlug: string
  onCreated: (areaId: number, variantId: number) => void
  onCancel: () => void
}) => {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const titleMissing = submitAttempted && title.trim().length === 0
  const [boundaryId, setBoundaryId] = useState<string | null>(null)
  const [studyArea, setStudyArea] = useState<unknown>(null)
  const [areaTab, setAreaTab] = useState<'search' | 'custom'>('search')
  const [userGeojson, setUserGeojson] = useState<GeoJSON.FeatureCollection | undefined>()
  const [userGeojsonMode, setUserGeojsonMode] = useState<UserGeojsonMode>('bonus')
  const [useCase, setUseCase] = useState<PlanningUseCase>('fahrradbox')
  const [areaSizeM2, setAreaSizeM2] = useState<number | null>(2)

  const effectiveStudyArea = useEffectiveStudyArea(studyArea)
  const areaKm2 = useStudyAreaKm2(effectiveStudyArea)
  const areaTooLarge = areaKm2 != null && areaKm2 > MAX_STUDY_AREA_KM2

  const mutation = useMutation({
    mutationFn: async () => {
      if (!effectiveStudyArea) throw new Error('Bitte ein Gebiet auswählen')
      if (areaTooLarge)
        throw new Error(
          `Das Berechnungsgebiet ist zu groß (${areaKm2?.toFixed(1)} km²). Maximal ${MAX_STUDY_AREA_KM2} km² sind erlaubt.`,
        )
      return createPlanningAreaFn({
        data: {
          regionSlug,
          title,
          studyArea: effectiveStudyArea,
          userGeojson,
          userGeojsonMode,
          useCase,
          areaSizeM2,
          // Die gewählte Flächengröße belegt die Flächensuche der ersten Variante vor;
          // danach ist sie je Variante frei änderbar.
          factorConfig: { ...DEFAULT_FACTOR_TEMPLATE, min_area_m2: areaSizeM2 },
        },
      })
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))
      queryClient.invalidateQueries(planningAreaQueryOptions(created.areaId))
      queryClient.invalidateQueries(planningVariantQueryOptions(created.variantId))
      onCreated(created.areaId, created.variantId)
    },
  })

  const handleSubmit = () => {
    setSubmitAttempted(true)
    if (title.trim().length === 0) return
    mutation.mutate()
  }

  return (
    <div className="flex flex-col gap-2">
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
        onUserGeojsonChange={setUserGeojson}
        onUserGeojsonModeChange={setUserGeojsonMode}
        onUseCaseChange={setUseCase}
        onAreaSizeM2Change={setAreaSizeM2}
        titleMissing={titleMissing}
      />

      {mutation.isError && (
        <p className="text-xs text-red-600">{String((mutation.error as Error).message)}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={mutation.isPending || !effectiveStudyArea || areaTooLarge}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Wird angelegt…' : 'Planungsgebiet anlegen'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Abbrechen
        </button>
      </div>
      {(title.trim().length === 0 || !effectiveStudyArea) && (
        <p className="text-xs text-red-600">Alle Felder ausfüllen</p>
      )}
    </div>
  )
}
