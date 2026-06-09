import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import {
  planningJobQueryOptions,
  planningScenarioQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { usePlanningRunParam } from '../hooks/useQueryState/usePlanningParams'

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
    }
  }, [data?.status, data?.resultRunId, scenarioId, setRun, queryClient])

  if (!data) return null

  return (
    <div className={`rounded px-2 py-1 text-sm ${COLORS[data.status] ?? ''}`}>
      {LABELS[data.status] ?? data.status}
      {data.status === 'FAILED' && data.errorMessage ? (
        <pre className="mt-1 max-h-24 overflow-auto text-xs whitespace-pre-wrap">
          {data.errorMessage}
        </pre>
      ) : null}
    </div>
  )
}
