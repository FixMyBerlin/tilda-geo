import { formatDateTime } from '@/src/app/_components/date/formatDate'
import { formatRelativeTime } from '@/src/app/_components/date/relativeTime'
import { buttonStylesOnYellow } from '@/src/app/_components/links/styles'
import { isDev } from '@/src/app/_components/utils/isEnv'
import { ObjectDump } from '@/src/app/admin/_components/ObjectDump'
import createQaEvaluation from '@/src/server/qa-configs/mutations/createQaEvaluation'
import getQaConfigsForRegion from '@/src/server/qa-configs/queries/getQaConfigsForRegion'
import getQaDataForMap, { QaMapData } from '@/src/server/qa-configs/queries/getQaDataForMap'
import getQaEvaluationsForArea from '@/src/server/qa-configs/queries/getQaEvaluationsForArea'
import { getQueryClient, getQueryKey, useMutation, useQuery } from '@blitzjs/rpc'
import { ExclamationTriangleIcon, UserIcon } from '@heroicons/react/20/solid'
import { QaSystemStatus } from '@prisma/client'
import { useState } from 'react'
import { MapGeoJSONFeature, useMap } from 'react-map-gl/maplibre'
import { useQaParam } from '../../_hooks/useQueryState/useQaParam'
import { useRegionSlug } from '../regionUtils/useRegionSlug'
import { Disclosure } from './Disclosure/Disclosure'
import { systemStatusConfig, userStatusConfig, userStatusOptions } from './InspectorQa/qaConfigs'
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
  const hasEvaluation = !!latestEvaluation
  const systemStatus = latestEvaluation?.systemStatus
  const userStatus = latestEvaluation?.userStatus
  const evaluatorType = latestEvaluation?.evaluatorType

  // Determine the current state
  const hasSystemEvaluation = hasEvaluation && systemStatus !== null
  const hasUserEvaluation = hasEvaluation && userStatus !== null

  // Get configs for display
  const systemConfig = systemStatus ? systemStatusConfig[systemStatus as QaSystemStatus] : null
  const userConfig = userStatus
    ? userStatusOptions.find((option) => option.value === userStatus)
    : null

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

  // Determine form visibility based on UX state
  // Primary: System evaluation exists but no user evaluation
  // Secondary: Everything else (no evaluation OR has user evaluation)
  const shouldShowFormPrimary = hasEvaluation && systemStatus !== null && userStatus === null
  const isFormVisible = shouldShowFormPrimary || (!shouldShowFormPrimary && showForm)

  const { geometry: _, _geometry: __, _vectorTileFeature: ___, ...debugSelectedFeature } = feature

  return (
    <Disclosure
      title="Qualitätssicherung"
      objectId={feature.properties.id.toString()}
      showLockIcon={true}
    >
      <div className="bg-amber-50 px-3 py-5">
        {/* Header Section */}
        <header className="space-y-3 rounded-lg bg-gray-50 p-4">
          {/* 1. User or System Evaluation with Date */}
          <div className="flex min-w-0 flex-1 justify-between space-x-4">
            <div className="flex items-center gap-2">
              {hasUserEvaluation && userConfig ? (
                <>
                  <UserIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {latestEvaluation?.author?.firstName ||
                      latestEvaluation?.author?.osmName ||
                      'Benutzer'}
                  </span>
                </>
              ) : hasSystemEvaluation && systemConfig ? (
                <>
                  <systemConfig.icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">System</span>
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">Keine Bewertung</span>
                </>
              )}
            </div>
            {latestEvaluation && (
              <div className="whitespace-nowrap text-right text-sm text-gray-500">
                <time title={formatDateTime(new Date(latestEvaluation.createdAt))}>
                  {formatRelativeTime(latestEvaluation.createdAt)}
                </time>
              </div>
            )}
          </div>

          {/* 2. Result (Icon + Text) */}
          <div className="flex items-center gap-2">
            {hasUserEvaluation && userConfig ? (
              <>
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: userConfig.hexColor }}
                />
                <span className="text-sm text-gray-700">{userConfig.label}</span>
              </>
            ) : hasSystemEvaluation && systemConfig ? (
              <>
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: systemConfig.hexColor }}
                />
                <span className="text-sm text-gray-700">{systemConfig.label}</span>
              </>
            ) : (
              <>
                <div className="h-3 w-3 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-700">Keine Bewertung</span>
              </>
            )}
          </div>
        </header>

        {/* User Evaluation Form */}
        {isFormVisible ? (
          <QaEvaluationForm onSubmit={handleSubmit} isLoading={isLoading} />
        ) : (
          <button onClick={() => setShowForm(true)} className={buttonStylesOnYellow}>
            {hasUserEvaluation ? 'Bewertung aktualisieren' : 'Bewertung hinzufügen'}
          </button>
        )}

        {/* 5. Always expanded list of all evaluations */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Bewertungsverlauf</h4>
          <QaEvaluationHistory evaluations={evaluations} />
        </div>

        {isDev && <ObjectDump data={debugSelectedFeature} />}
        {isDev && <ObjectDump data={evaluations} />}
      </div>
    </Disclosure>
  )
}
