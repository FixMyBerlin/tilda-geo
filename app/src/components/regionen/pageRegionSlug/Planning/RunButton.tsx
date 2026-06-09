import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { runPlanningScenarioFn } from '@/server/planning/planning.functions'
import { JobStatusBadge } from './JobStatusBadge'

/** Enqueues a background run for a scenario and surfaces its live status. */
export const RunButton = ({ scenarioId }: { scenarioId: number }) => {
  const [jobId, setJobId] = useState<number | null>(null)

  const mutation = useMutation({
    mutationFn: () => runPlanningScenarioFn({ data: { scenarioId } }),
    onSuccess: (job) => setJobId(job.id),
  })

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {mutation.isPending ? 'Wird gestartet…' : 'Berechnung starten'}
      </button>
      {jobId != null && <JobStatusBadge jobId={jobId} scenarioId={scenarioId} />}
    </div>
  )
}
