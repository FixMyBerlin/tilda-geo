import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  planningJobQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { Spinner } from '../Spinner'
import { deriveScoringStep, PlanningSteps } from './PlanningSteps'

const LABELS: Record<string, string> = {
  QUEUED: 'In Warteschlange…',
  RUNNING: 'Berechnung läuft…',
  DONE: 'Fertig',
  FAILED: 'Fehlgeschlagen',
}

const COLORS: Record<string, string> = {
  QUEUED: 'bg-gray-200 text-gray-800',
  RUNNING: 'bg-blue-100 text-blue-800',
  DONE: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
}

/** Polls a job until DONE/FAILED. On DONE, shows the run on the map + refreshes variant. */
export const JobStatusBadge = ({ jobId, variantId }: { jobId: number; variantId: number }) => {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    ...planningJobQueryOptions(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'DONE' || status === 'FAILED' ? false : 2000
    },
  })

  useEffect(() => {
    if (data?.status !== 'DONE' || data.resultRunId == null) return
    // No explicit "show this run" write: the shown run is always `variant.currentRunId` (D7), which
    // the worker already set server-side — this invalidation just refetches it.
    queryClient.invalidateQueries(planningVariantQueryOptions(variantId))
    queryClient.invalidateQueries({ queryKey: ['planning', 'areas'] })
  }, [data?.status, data?.resultRunId, variantId, queryClient])

  // Der "Neu berechnen"-Button in RunButton zeigt den fertigen Zustand schon an.
  if (!data || data.status === 'DONE') return null

  const showProgress =
    (data.status === 'RUNNING' || data.status === 'QUEUED') && data.progress != null

  const jobActive = data.status === 'RUNNING' || data.status === 'QUEUED'

  const currentStep = deriveScoringStep(data.status, data.progress, data.progressLabel)
  // Das numerische "n/total · "-Präfix der Scoring-Schritte zeigt schon die
  // Schrittliste – im Header nur den reinen Namen anhängen.
  const headerLabel = data.progressLabel?.replace(/^\d+\/\d+\s*·\s*/, '')

  return (
    <div className={`rounded px-2 py-1 text-sm ${COLORS[data.status] ?? ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          {jobActive ? (
            <Spinner
              className="h-3 w-3 border-current"
              label={LABELS[data.status] ?? data.status}
            />
          ) : null}
          <span>
            {LABELS[data.status] ?? data.status}
            {showProgress && headerLabel ? ` – ${headerLabel}` : ''}
          </span>
        </span>
        {showProgress ? <span className="tabular-nums">{data.progress} %</span> : null}
      </div>
      {showProgress ? (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-white/60">
          <div
            className="h-full rounded bg-blue-500 transition-all"
            style={{ width: `${data.progress}%` }}
          />
        </div>
      ) : null}
      {showProgress ? (
        <PlanningSteps
          currentStep={currentStep}
          weights={data.weights}
          userObstacles={{ present: data.userGeojsonPresent, mode: data.userGeojsonMode }}
        />
      ) : null}
      {data.status === 'FAILED' && data.errorMessage ? (
        <pre className="mt-1 max-h-24 overflow-auto text-xs whitespace-pre-wrap">
          {data.errorMessage}
        </pre>
      ) : null}
    </div>
  )
}
