import { useMutation, useQueryClient } from '@tanstack/react-query'
import { runPlanningVariantFn } from '@/server/planning/planning.functions'
import {
  planningAreasQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { usePlanningBoundaryState } from '../hooks/mapState/usePlanningBoundaryState'
import { JobStatusBadge } from './JobStatusBadge'

type LatestJob = { id: number; status: string }

/** Enqueues a background run for a variant. */
export const RunButton = ({
  variantId,
  regionSlug,
  latestJob,
}: {
  variantId: number
  regionSlug: string
  latestJob?: LatestJob | null
}) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => runPlanningVariantFn({ data: { variantId } }),
    onSuccess: () => {
      queryClient.invalidateQueries(planningVariantQueryOptions(variantId))
      queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))
    },
  })

  const isInFlight = latestJob?.status === 'QUEUED' || latestJob?.status === 'RUNNING'
  const hasFinishedRun = latestJob?.status === 'DONE' || latestJob?.status === 'FAILED'
  // Faktoren speichern sich automatisch; bis das durch ist, würde der Lauf serverseitig noch
  // mit dem alten Stand rechnen (siehe FactorEditorPanel).
  const factorSavePending = usePlanningBoundaryState((s) => s.factorSavePending)

  const label = mutation.isPending
    ? 'Wird gestartet…'
    : factorSavePending
      ? 'Faktoren werden gespeichert…'
      : hasFinishedRun
        ? 'Neu berechnen'
        : 'Berechnung starten'

  return (
    <div className="flex flex-col gap-2">
      {!isInFlight && (
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || factorSavePending}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {label}
        </button>
      )}
      {latestJob != null && <JobStatusBadge jobId={latestJob.id} variantId={variantId} />}
    </div>
  )
}
