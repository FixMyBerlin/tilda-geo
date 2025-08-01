import { buttonStylesOnYellow } from '@/src/app/_components/links/styles'
import { isDev } from '@/src/app/_components/utils/isEnv'
import { ObjectDump } from '@/src/app/admin/_components/ObjectDump'
import createQaEvaluation from '@/src/server/qa-configs/mutations/createQaEvaluation'
import getQaConfigsForRegion from '@/src/server/qa-configs/queries/getQaConfigsForRegion'
import getQaDataForMap, { QaMapData } from '@/src/server/qa-configs/queries/getQaDataForMap'
import getQaEvaluationsForArea from '@/src/server/qa-configs/queries/getQaEvaluationsForArea'
import { getQueryClient, getQueryKey, useMutation, useQuery } from '@blitzjs/rpc'
import { useState } from 'react'
import { MapGeoJSONFeature, useMap } from 'react-map-gl/maplibre'
import { useQaParam } from '../../_hooks/useQueryState/useQaParam'
import { useRegionSlug } from '../regionUtils/useRegionSlug'
import { Disclosure } from './Disclosure/Disclosure'
import { userStatusConfig } from './InspectorQa/qaConfigs'
import { QaEvaluationCard } from './InspectorQa/QaEvaluationCard'
import { QaEvaluationForm } from './InspectorQa/QaEvaluationForm'
import { QaEvaluationHistory } from './InspectorQa/QaEvaluationHistory'
import { QaIcon } from './InspectorQa/QaIcon'

type Props = {
  feature: MapGeoJSONFeature // Area geometry from QA layer with required id property
}

export const InspectorFeatureQa = ({ feature }: Props) => {
  const regionSlug = useRegionSlug()
  const { qaParamData } = useQaParam()
  const { mainMap } = useMap()
  const [showForm, setShowForm] = useState(false)

  const [evaluations] = useQuery(getQaEvaluationsForArea, {
    configSlug: qaParamData.configSlug,
    areaId: feature.properties.id.toString(),
    regionSlug: regionSlug!,
  })

  const [createEvaluationMutation, { isLoading }] = useMutation(createQaEvaluation)

  // Get QA configs to find the active config for map data
  const [qaConfigs] = useQuery(getQaConfigsForRegion, { regionSlug: regionSlug! })
  const activeQaConfig = qaConfigs?.find((config) => config.slug === qaParamData.configSlug)

  const latestEvaluation = evaluations?.[0]
  const hasEvaluation = !!latestEvaluation
  const systemStatus = latestEvaluation?.systemStatus
  const userStatus = latestEvaluation?.userStatus
  const hasUserEvaluation = hasEvaluation && userStatus !== null

  // Optimistic update function
  const updateFeatureStateOptimistically = (userStatus: string) => {
    if (!mainMap) return

    const statusConfig = userStatusConfig[userStatus as keyof typeof userStatusConfig]
    if (!statusConfig) return

    // Find the specific feature using filter in queryRenderedFeatures
    const qaFeatures = mainMap.queryRenderedFeatures({
      layers: ['qa-layer'],
      filter: ['==', ['get', 'id'], feature.properties.id.toString()],
    })

    const targetFeature = qaFeatures[0] // Should only be one feature
    if (targetFeature) {
      mainMap.setFeatureState(targetFeature, {
        qaColor: statusConfig.hexColor,
      })
    }

    // Optimistically update the map data cache
    if (activeQaConfig) {
      const queryClient = getQueryClient()
      const mapDataQueryKey = getQueryKey(getQaDataForMap, {
        configId: activeQaConfig.id,
        regionSlug: regionSlug!,
      })

      // Get current map data
      const currentMapData = queryClient.getQueryData<QaMapData[]>(mapDataQueryKey) || []

      // Create optimistic map data entry
      const statusConfig = userStatusConfig[userStatus as keyof typeof userStatusConfig]
      const optimisticMapData: QaMapData = {
        areaId: feature.properties.id.toString(),
        displayColor: statusConfig.hexColor,
      }

      // Update or add the optimistic entry
      const updatedMapData = currentMapData.map((item) =>
        item.areaId === feature.properties.id.toString() ? optimisticMapData : item,
      )

      // If the area doesn't exist in current data, add it
      if (!currentMapData.find((item) => item.areaId === feature.properties.id.toString())) {
        updatedMapData.push(optimisticMapData)
      }

      // Update cache optimistically
      queryClient.setQueryData(mapDataQueryKey, updatedMapData)
    }
  }

  const handleSubmit = async (userStatus: string, body?: string) => {
    try {
      // Optimistic update - immediately update the map and cache
      updateFeatureStateOptimistically(userStatus)

      // Submit to server
      await createEvaluationMutation({
        configSlug: qaParamData.configSlug,
        areaId: feature.properties.id.toString(),
        regionSlug: regionSlug!,
        userStatus: userStatus as any,
        body,
      })

      // Revalidate the evaluations data to refresh the inspector
      const queryClient = getQueryClient()
      const evaluationsQueryKey = getQueryKey(getQaEvaluationsForArea, {
        configSlug: qaParamData.configSlug,
        areaId: feature.properties.id.toString(),
        regionSlug: regionSlug!,
      })
      await queryClient.invalidateQueries({ queryKey: evaluationsQueryKey })

      setShowForm(false)
    } catch (error) {
      console.error('Failed to create evaluation:', error)
      // TODO: Revert optimistic update on error
    }
  }

  // Determine form visibility based on UX state
  // Primary: System evaluation exists but no user evaluation
  // Secondary: Everything else (no evaluation OR has user evaluation)
  const shouldShowFormPrimary = hasEvaluation && systemStatus !== null && userStatus === null
  const isFormVisible = shouldShowFormPrimary || (!shouldShowFormPrimary && showForm)

  const { geometry: _, _geometry: __, _vectorTileFeature: ___, ...debugSelectedFeature } = feature

  return (
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
        {/* Header Section - Full Latest Evaluation */}
        {latestEvaluation && <QaEvaluationCard evaluation={latestEvaluation} variant="header" />}

        {/* User Evaluation Form */}
        <section className="mt-5">
          {isFormVisible ? (
            <QaEvaluationForm onSubmit={handleSubmit} isLoading={isLoading} />
          ) : (
            <button onClick={() => setShowForm(true)} className={buttonStylesOnYellow}>
              {hasUserEvaluation ? 'Bewertung aktualisieren' : 'Bewertung hinzufügen'}
            </button>
          )}
        </section>

        {/* 5. Always expanded list of all evaluations */}
        {evaluations.length > 1 && (
          <div className="mt-5">
            <h4 className="mb-2 text-sm font-medium text-gray-900">
              Bewertungsverlauf ({evaluations.length - 1})
            </h4>
            <QaEvaluationHistory evaluations={evaluations} />
          </div>
        )}

        {isDev && <ObjectDump data={debugSelectedFeature} />}
        {isDev && <ObjectDump data={evaluations} />}
      </div>
    </Disclosure>
  )
}
