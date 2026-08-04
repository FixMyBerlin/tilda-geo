import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  planningJobQueryOptions,
  planningScenarioQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { usePlanningBoundaryState } from '../hooks/mapState/usePlanningBoundaryState'
import { usePlanningRunParam } from '../hooks/useQueryState/usePlanningParams'
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

/** Polls a job until DONE/FAILED. On DONE, shows the run on the map + refreshes scenario. */
export const JobStatusBadge = ({ jobId, scenarioId }: { jobId: number; scenarioId: number }) => {
  const queryClient = useQueryClient()
  const [, setRun] = usePlanningRunParam()
  const setPanelCollapsed = usePlanningBoundaryState((s) => s.setPanelCollapsed)

  const { data } = useQuery({
    ...planningJobQueryOptions(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'DONE' || status === 'FAILED' ? false : 2000
    },
  })

  useEffect(() => {
    if (data?.status === 'DONE' && data.resultRunId != null) {
      setRun(data.resultRunId)
      queryClient.invalidateQueries(planningScenarioQueryOptions(scenarioId))
      // Result is saved – collapse the panel so more of the map is visible.
      setPanelCollapsed(true)
    }
  }, [data?.status, data?.resultRunId, scenarioId, setRun, queryClient, setPanelCollapsed])

  if (!data) return null

  const showProgress =
    (data.status === 'RUNNING' || data.status === 'QUEUED') && data.progress != null

  const currentStep = deriveScoringStep(data.status, data.progress, data.progressLabel)
  // Das numerische "n/total · "-Präfix der Scoring-Schritte zeigt schon die
  // Schrittliste – im Header nur den reinen Namen anhängen.
  const headerLabel = data.progressLabel?.replace(/^\d+\/\d+\s*·\s*/, '')

  return (
    <div className={`rounded px-2 py-1 text-sm ${COLORS[data.status] ?? ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span>
          {LABELS[data.status] ?? data.status}
          {showProgress && headerLabel ? ` – ${headerLabel}` : ''}
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
