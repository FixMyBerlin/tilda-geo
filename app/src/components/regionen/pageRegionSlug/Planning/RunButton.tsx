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
  // A previous run finished (DONE/FAILED): allow re-running the same study area
  // with (potentially) changed factors. Only hide the button while in flight.
  const hasFinishedRun = latestJob?.status === 'DONE' || latestJob?.status === 'FAILED'

  const label = mutation.isPending
    ? 'Wird gestartet…'
    : hasFinishedRun
      ? 'Neu berechnen'
      : 'Berechnung starten'

  return (
    <div className="flex flex-col gap-2">
      {!isInFlight && (
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {label}
        </button>
      )}
      {latestJob != null && <JobStatusBadge jobId={latestJob.id} scenarioId={scenarioId} />}
    </div>
  )
}
