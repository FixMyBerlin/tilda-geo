import { formatRelativeTime } from '@/src/app/_components/date/relativeTime'
import { buttonStyles } from '@/src/app/_components/links/styles'
import createQaEvaluation from '@/src/server/qa-configs/mutations/createQaEvaluation'
import getQaEvaluationsForArea from '@/src/server/qa-configs/queries/getQaEvaluationsForArea'
import { useMutation, useQuery } from '@blitzjs/rpc'
import { QaSystemStatus } from '@prisma/client'
import { useState } from 'react'
import { MapGeoJSONFeature } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { useQaParam } from '../../_hooks/useQueryState/useQaParam'
import { useRegionSlug } from '../regionUtils/useRegionSlug'
import { systemStatusConfig } from './InspectorQa/qaConfigs'
import { QaEvaluationForm } from './InspectorQa/QaEvaluationForm'
import { QaEvaluationHistory } from './InspectorQa/QaEvaluationHistory'

type Props = {
  feature: MapGeoJSONFeature // Area geometry from QA layer with required id property
}

export const InspectorFeatureQa = ({ feature }: Props) => {
  const regionSlug = useRegionSlug()
  const { qaParamData } = useQaParam()
  const [showForm, setShowForm] = useState(false)

  const [evaluations] = useQuery(getQaEvaluationsForArea, {
    configSlug: qaParamData.configSlug,
    areaId: feature.properties.id.toString(),
    regionSlug: regionSlug!,
  })

  const [createEvaluationMutation, { isLoading }] = useMutation(createQaEvaluation)

  const latestEvaluation = evaluations?.[0]
  const systemStatus = latestEvaluation?.systemStatus || 'NEEDS_REVIEW'
  const config = systemStatusConfig[systemStatus as QaSystemStatus]

  const handleSubmit = async (userStatus: string, body?: string) => {
    try {
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
    }
  }

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
    </div>
  )
}
