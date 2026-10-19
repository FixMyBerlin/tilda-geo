import { useMutation, useQueryClient } from '@tanstack/react-query'
import { runPlanningVariantFn } from '@/server/planning/planning.functions'
import {
  planningAreasQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { useSpaceFinderFactorSavePending } from '../../../hooks/mapState/space-finder-boundary-store'
import { useRegionSlug } from '../../../regionUtils/useRegionSlug'
import {
  type SpaceFinderVariantStatus,
  spaceFinderRunNeedsRerun,
} from '../collection/spaceFinderCollectionOptions'
import { JobStatusBadge } from './JobStatusBadge'

type LatestJob = { id: number; status: string }

/** Enqueues a background run for a variant. */
export const RunButton = ({
  variantId,
  status,
  latestJob,
  showJobStatus = true,
}: {
  variantId: number
  status: SpaceFinderVariantStatus
  latestJob?: LatestJob | null
  /** Set false when the caller shows `JobStatusBadge` itself elsewhere (Flächenfinder: the
   * sticky footer only holds the button; progress/outdated status lives in its own section). */
  showJobStatus?: boolean
}) => {
  const regionSlug = useRegionSlug()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => runPlanningVariantFn({ data: { variantId } }),
    onSuccess: () => {
      queryClient.invalidateQueries(planningVariantQueryOptions(variantId))
      queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))
    },
  })

  const isInFlight = status === 'running'
  const hasFinishedRun = spaceFinderRunNeedsRerun(status, latestJob?.status)
  // Factors save automatically; until that is done, the run would still compute server-side
  // with the old state (see FactorEditorPanel).
  const factorSavePending = useSpaceFinderFactorSavePending()

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
      {showJobStatus && latestJob != null && (
        <JobStatusBadge jobId={latestJob.id} variantId={variantId} />
      )}
    </div>
  )
}
