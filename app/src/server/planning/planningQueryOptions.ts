import { queryOptions } from '@tanstack/react-query'
import {
  getAdminBoundariesFn,
  getBoundaryGeomFn,
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

// Admin boundaries (levels 8–10) for study_area selection, filtered to the given region.
// Metadata only – geometries are loaded per boundary via `boundaryGeomQueryOptions`.
export const adminBoundariesQueryOptions = (regionSlug: string) =>
  queryOptions({
    queryKey: ['planning', 'adminBoundaries', regionSlug] as const,
    queryFn: () => getAdminBoundariesFn({ data: { regionSlug } }),
    staleTime: 1000 * 60 * 60, // 1h
  })

// Geometry of a single admin boundary, fetched when the user picks it as study_area.
export const boundaryGeomQueryOptions = (regionSlug: string, boundaryId: string) =>
  queryOptions({
    queryKey: ['planning', 'boundaryGeom', boundaryId] as const,
    queryFn: () => getBoundaryGeomFn({ data: { regionSlug, boundaryId } }),
    staleTime: 1000 * 60 * 60, // 1h
  })
