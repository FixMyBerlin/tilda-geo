import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import {
  getAdminBoundariesFn,
  getBoundaryGeomFn,
  getPlanningAreaFn,
  getPlanningAreasFn,
  getPlanningJobFn,
  getPlanningVariantFn,
} from './planning.functions'

export const planningAreasQueryOptions = (regionSlug: string) =>
  queryOptions({
    queryKey: ['planning', 'areas', regionSlug] as const,
    queryFn: () => getPlanningAreasFn({ data: { regionSlug } }),
  })

export const planningAreaQueryOptions = (areaId: number) =>
  queryOptions({
    queryKey: ['planning', 'area', areaId] as const,
    queryFn: () => getPlanningAreaFn({ data: { areaId } }),
  })

export const planningVariantQueryOptions = (variantId: number) =>
  queryOptions({
    queryKey: ['planning', 'variant', variantId] as const,
    queryFn: () => getPlanningVariantFn({ data: { variantId } }),
  })

export const planningJobQueryOptions = (jobId: number) =>
  queryOptions({
    queryKey: ['planning', 'job', jobId] as const,
    queryFn: () => getPlanningJobFn({ data: { jobId } }),
  })

export const adminBoundariesQueryOptions = (regionSlug: string, query: string) =>
  queryOptions({
    queryKey: ['planning', 'adminBoundaries', regionSlug, query] as const,
    queryFn: () => getAdminBoundariesFn({ data: { regionSlug, query } }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60,
  })

export const boundaryGeomQueryOptions = (regionSlug: string, boundaryId: string) =>
  queryOptions({
    queryKey: ['planning', 'boundaryGeom', boundaryId] as const,
    queryFn: () => getBoundaryGeomFn({ data: { regionSlug, boundaryId } }),
    staleTime: 1000 * 60 * 60,
  })
