import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useOptimistic, useState } from 'react'
import { IntlProvider } from 'react-intl'
import type { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { useMap } from 'react-map-gl/maplibre'
import { ObjectDump } from '@/components/admin/ObjectDump'
import { filterQaDataByStyle } from '@/components/regionen/pageRegionSlug/hooks/mapState/useQaMapState'
import { useQaFilterParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaFilterParam'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'
import { isDev } from '@/components/shared/utils/isEnv'
import {
  getQaDecisionDataForAreaFn,
  getQaEvaluationsForAreaFn,
} from '@/server/qa-configs/qa-configs.functions'
import type { CreateQaEvaluationInput } from '@/server/qa-configs/qa-configs.functions'
import { createQaEvaluationFn } from '@/server/qa-configs/qa-configs.functions'
import type { QaMapData } from '@/server/qa-configs/queries/getQaDataForMap.server'
import type { QaEvaluationForArea } from '@/server/qa-configs/queries/getQaEvaluationsForArea.server'
import { regionQaConfigsQueryOptions } from '@/server/regions/regionQueryOptions'
import { Disclosure } from './Disclosure/Disclosure'
import { QaDecisionData as QaDecisionDataComponent } from './InspectorQa/QaDecisionData'
import { QaEvaluationCard } from './InspectorQa/QaEvaluationCard'
import { QaEvaluationForm } from './InspectorQa/QaEvaluationForm'
import { QaEvaluationHistory } from './InspectorQa/QaEvaluationHistory'
import { QaIcon } from './InspectorQa/QaIcon'
import { USER_STATUS_TO_LETTER, userStatusConfig } from './InspectorQa/qaConfigs'
import { translations } from './TagsTable/translations/translations.const'

type Props = {
  feature: MapGeoJSONFeature // Area geometry from QA layer with required id property
}

export const InspectorFeatureQa = ({ feature }: Props) => {
  const regionSlug = useRegionSlug()
  const { qaParamData } = useQaParam()
  const { qaFilterParam } = useQaFilterParam()
  const { mainMap } = useMap()
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const areaId = feature.properties.id.toString()
  const { data: evaluations } = useQuery<QaEvaluationForArea[]>({
    queryKey: ['qaEvaluations', qaParamData.configSlug, areaId, regionSlug],
    queryFn: () =>
      getQaEvaluationsForAreaFn({
        data: {
          configSlug: qaParamData.configSlug,
          areaId,
          regionSlug: regionSlug,
        },
      }),
    enabled: Boolean(regionSlug && qaParamData.configSlug),
  })

  const { data: decisionData } = useQuery({
    queryKey: ['qaDecisionData', qaParamData.configSlug, areaId, regionSlug],
    queryFn: () =>
      getQaDecisionDataForAreaFn({
        data: {
          configSlug: qaParamData.configSlug,
          areaId,
          regionSlug: regionSlug,
        },
      }),
    enabled: Boolean(regionSlug && qaParamData.configSlug),
  })

  const { data: qaConfigs } = useQuery(regionQaConfigsQueryOptions(regionSlug ?? ''))
  const activeQaConfig = qaConfigs?.find((config) => config.slug === qaParamData.configSlug)
  const userIds =
    qaParamData.style === 'user-selected' && qaFilterParam?.users ? qaFilterParam.users : []
  const mapDataQueryKey =
    activeQaConfig && regionSlug
      ? ['qa-configs', 'getQaDataForMap', { configId: activeQaConfig.id, regionSlug, userIds }]
      : null

  const latestEvaluation = evaluations?.[0]
  const hasEvaluation = !!latestEvaluation
  const systemStatus = latestEvaluation?.systemStatus
  const baseUserStatus = latestEvaluation?.userStatus ?? null

  // React 19: useOptimistic for optimistic UI updates with automatic rollback
  // useOptimistic automatically syncs with baseUserStatus when it changes
  const [optimisticUserStatus, setOptimisticUserStatus] = useOptimistic<string | null, string>(
    baseUserStatus,
    (_currentStatus, newStatus: string) => newStatus,
  )

  // Use optimistic status for UI (useOptimistic handles base state internally)
  const userStatus = optimisticUserStatus
  const hasUserEvaluation = hasEvaluation && userStatus !== null

  // Side effects for map state and cache updates (not handled by useOptimistic)
  const updateFeatureStateSideEffects = (status: string) => {
    if (!mainMap) return

    const statusConfig = userStatusConfig[status as keyof typeof userStatusConfig]
    if (!statusConfig) return

    // Find the specific feature using filter in queryRenderedFeatures
    const qaFeatures = mainMap.queryRenderedFeatures({
      layers: ['qa-layer'],
      filter: ['==', ['get', 'id'], feature.properties.id.toString()],
    })

    const targetFeature = qaFeatures[0] // Should only be one feature
    if (targetFeature) {
      mainMap.setFeatureState(targetFeature, {
        userStatus: USER_STATUS_TO_LETTER[status as keyof typeof USER_STATUS_TO_LETTER],
        // Keep existing system status
        systemStatus: targetFeature.state?.systemStatus || null,
      })
    }

    // Optimistically update the map data cache (same key as useQaMapState)
    if (mapDataQueryKey) {
      // Get current map data
      const currentMapData = queryClient.getQueryData<QaMapData[]>(mapDataQueryKey) || []

      // Create optimistic map data entry
      const optimisticMapData: QaMapData = {
        areaId: feature.properties.id.toString(),
        systemStatus: targetFeature?.state?.systemStatus || null,
        userStatus: USER_STATUS_TO_LETTER[status as keyof typeof USER_STATUS_TO_LETTER],
      }

      // Update or add the optimistic entry
      const updatedMapData = currentMapData.map((item) =>
        item.areaId === feature.properties.id.toString() ? optimisticMapData : item,
      )

      // If the area doesn't exist in current data, add it
      if (!currentMapData.find((item) => item.areaId === feature.properties.id.toString())) {
        updatedMapData.push(optimisticMapData)
      }

      // Apply the same filter rules to the optimistic update
      const filteredMapData = filterQaDataByStyle(updatedMapData, qaParamData.style)

      // Update cache optimistically with filtered data
      queryClient.setQueryData(mapDataQueryKey, filteredMapData)
    }
  }

  const { mutate: createEvaluationMutation, isPending } = useMutation({
    mutationFn: (input: CreateQaEvaluationInput) => createQaEvaluationFn({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qaEvaluations'] })
    },
    onError: () => {
      // useOptimistic automatically rolls back UI state, but we need to revert side effects
      // Revert map state and cache on error
      if (baseUserStatus !== null) {
        updateFeatureStateSideEffects(baseUserStatus)
      } else {
        // Remove from cache if no previous status
        if (mapDataQueryKey) {
          const currentMapData = queryClient.getQueryData<QaMapData[]>(mapDataQueryKey) || []
          const updatedMapData = currentMapData.filter(
            (item) => item.areaId !== feature.properties.id.toString(),
          )
          queryClient.setQueryData(mapDataQueryKey, updatedMapData)
        }
      }
    },
  })

  const handleSubmit = (values: { userStatus: string; comment?: string }) => {
    try {
      const { userStatus: submittedStatus, comment: body } = values
      setOptimisticUserStatus(submittedStatus)
      updateFeatureStateSideEffects(submittedStatus)

      createEvaluationMutation({
        configSlug: qaParamData.configSlug,
        areaId: feature.properties.id.toString(),
        regionSlug: regionSlug,
        userStatus: submittedStatus as CreateQaEvaluationInput['userStatus'],
        body,
        decisionData: decisionData || undefined,
      })

      const evaluationsQueryKey = [
        'qaEvaluations',
        qaParamData.configSlug,
        feature.properties.id.toString(),
        regionSlug,
      ]
      queryClient.invalidateQueries({ queryKey: evaluationsQueryKey })

      setShowForm(false)
    } catch (error) {
      console.error('Failed to create evaluation:', error)
    }
  }

  // Determine form visibility based on UX state
  // Primary: System evaluation exists but no user evaluation
  // Secondary: Everything else (no evaluation OR has user evaluation)
  const shouldShowFormPrimary = hasEvaluation && systemStatus !== null && userStatus === null
  const isFormVisible = shouldShowFormPrimary || (!shouldShowFormPrimary && showForm)

  const { geometry: _, _geometry: __, _vectorTileFeature: ___, ...debugSelectedFeature } = feature

  return (
    <IntlProvider messages={translations} locale="de" defaultLocale="de">
      <Disclosure
        title={
          <span className="inline-flex items-center gap-2 leading-tight">
            <QaIcon isActive={activeQaConfig?.isActive ?? false} className="size-4" />
            Qualitätssicherung
          </span>
        }
        objectId={feature.properties.id.toString()}
        showLockIcon={true}
      >
        <div className="bg-violet-50 px-3 py-5">
          {/* Current State Data - Shown above evaluation */}
          {decisionData && (
            <div className="mb-5">
              <h4 className="mb-2 text-sm font-medium text-gray-900">Aktueller Zustand</h4>
              <QaDecisionDataComponent decisionData={decisionData} />
            </div>
          )}

          {/* Header Section - Full Latest Evaluation */}
          {latestEvaluation && <QaEvaluationCard evaluation={latestEvaluation} variant="header" />}

          {/* User Evaluation Form */}
          <section className="mt-5">
            {isFormVisible ? (
              <QaEvaluationForm onSubmit={handleSubmit} isLoading={isPending} />
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className={buttonStylesOnYellow}
              >
                {hasUserEvaluation ? 'Bewertung aktualisieren' : 'Bewertung hinzufügen'}
              </button>
            )}
          </section>

          {/* 5. Always expanded list of all evaluations */}
          {evaluations && evaluations.length > 1 && (
            <div className="mt-5">
              <h4 className="mb-2 text-sm font-medium text-gray-900">
                Bewertungsverlauf ({evaluations.length - 1})
              </h4>
              <QaEvaluationHistory evaluations={evaluations} />
            </div>
          )}

          {isDev && <ObjectDump title="decisionData" data={decisionData} />}
          {isDev && <ObjectDump title="selectedFeature" data={debugSelectedFeature} />}
          {isDev && <ObjectDump title="evaluations" data={evaluations} />}
        </div>
      </Disclosure>
    </IntlProvider>
  )
}
