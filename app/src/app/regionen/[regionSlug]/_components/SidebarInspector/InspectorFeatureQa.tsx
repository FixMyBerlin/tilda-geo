import { formatRelativeTime } from '@/src/app/_components/date/relativeTime'
import { buttonStyles } from '@/src/app/_components/links/styles'
import { isDev } from '@/src/app/_components/utils/isEnv'
import createQaEvaluation from '@/src/server/qa-configs/mutations/createQaEvaluation'
import getQaConfigsForRegion from '@/src/server/qa-configs/queries/getQaConfigsForRegion'
import getQaDataForMap, { QaMapData } from '@/src/server/qa-configs/queries/getQaDataForMap'
import getQaEvaluationsForArea from '@/src/server/qa-configs/queries/getQaEvaluationsForArea'
import { getQueryClient, getQueryKey, useMutation, useQuery } from '@blitzjs/rpc'
import { QaSystemStatus } from '@prisma/client'
import { useState } from 'react'
import { MapGeoJSONFeature, useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { useQaParam } from '../../_hooks/useQueryState/useQaParam'
import { useRegionSlug } from '../regionUtils/useRegionSlug'
import { systemStatusConfig, userStatusConfig } from './InspectorQa/qaConfigs'
import { QaEvaluationForm } from './InspectorQa/QaEvaluationForm'
import { QaEvaluationHistory } from './InspectorQa/QaEvaluationHistory'

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
  const systemStatus = latestEvaluation?.systemStatus || 'NEEDS_REVIEW'
  const config = systemStatusConfig[systemStatus as QaSystemStatus]

  // Optimistic update function
  const updateFeatureStateOptimistically = (userStatus: string, body?: string) => {
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
      updateFeatureStateOptimistically(userStatus, body)

      // Submit to server
      await createEvaluationMutation({
        configSlug: qaParamData.configSlug,
        areaId: feature.properties.id.toString(),
        regionSlug: regionSlug!,
        userStatus: userStatus as any,
        body,
      })
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create evaluation:', error)
      // TODO: Revert optimistic update on error
    }
  }

  const { geometry: _, _geometry: __, _vectorTileFeature: ___, ...debugRest } = feature

  return (
    <div className="space-y-4">
      {/* System Status */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className={twJoin('rounded-full p-2 text-white', config.color)}>
            <config.icon className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900">{config.label}</h3>
          <p className="text-sm text-gray-600">{config.description}</p>
          {latestEvaluation && (
            <p className="mt-1 text-xs text-gray-500">
              Letzte Aktualisierung: {formatRelativeTime(latestEvaluation.createdAt)}
            </p>
          )}
        </div>
      </div>

      {/* User Evaluation Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className={twJoin(buttonStyles, 'w-full bg-white px-3 py-2 text-sm')}
        >
          Bewertung hinzufügen
        </button>
      ) : (
        <QaEvaluationForm onSubmit={handleSubmit} isLoading={isLoading} />
      )}

      {/* Evaluation History */}
      <QaEvaluationHistory evaluations={evaluations} />

      {isDev && <pre className="text-xs leading-tight">{JSON.stringify(debugRest, null, 2)}</pre>}
    </div>
  )
}
