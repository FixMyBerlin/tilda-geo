import { useMutation, useQueryClient } from '@tanstack/react-query'
import { runPlanningScenarioFn } from '@/server/planning/planning.functions'
import {
  planningScenariosQueryOptions,
  planningScenarioQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { JobStatusBadge } from './JobStatusBadge'

type LatestJob = { id: number; status: string }

/**
 * Enqueues a background run for a scenario.
 * Job status comes from the parent scenario query (persists across reloads)
 * rather than local state.
 */
export const RunButton = ({
  scenarioId,
  regionSlug,
  latestJob,
}: {
  scenarioId: number
  regionSlug: string
  latestJob?: LatestJob | null
}) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => runPlanningScenarioFn({ data: { scenarioId } }),
    onSuccess: () => {
      queryClient.invalidateQueries(planningScenarioQueryOptions(scenarioId))
      queryClient.invalidateQueries(planningScenariosQueryOptions(regionSlug))
    },
  })

  const isInFlight = latestJob?.status === 'QUEUED' || latestJob?.status === 'RUNNING'
  const isDone = latestJob?.status === 'DONE'

  return (
    <div className="flex flex-col gap-2">
      {!isDone && (
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || isInFlight}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Wird gestartet…' : 'Berechnung starten'}
        </button>
      )}
      {latestJob != null && <JobStatusBadge jobId={latestJob.id} scenarioId={scenarioId} />}
    </div>
  )
}
