import { queryOptions } from '@tanstack/react-query'
import {
  getPlanningJobFn,
  getPlanningScenarioFn,
  getPlanningScenariosFn,
} from './planning.functions'

export const planningScenariosQueryOptions = (regionSlug: string) =>
  queryOptions({
    queryKey: ['planning', 'scenarios', regionSlug] as const,
    queryFn: () => getPlanningScenariosFn({ data: { regionSlug } }),
  })

export const planningScenarioQueryOptions = (scenarioId: number) =>
  queryOptions({
    queryKey: ['planning', 'scenario', scenarioId] as const,
    queryFn: () => getPlanningScenarioFn({ data: { scenarioId } }),
  })

// Polled while a job is in flight; stops once DONE/FAILED (handled in the component
// via refetchInterval returning false).
export const planningJobQueryOptions = (jobId: number) =>
  queryOptions({
    queryKey: ['planning', 'job', jobId] as const,
    queryFn: () => getPlanningJobFn({ data: { jobId } }),
  })
