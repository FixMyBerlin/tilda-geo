import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import {
  getAdminBoundariesFn,
  getBoundaryGeomFn,
  getSpaceFinderAreaFn,
  getSpaceFinderAreasFn,
  getSpaceFinderJobFn,
  getSpaceFinderVariantFn,
} from './space-finder.functions'

export const spaceFinderAreasQueryOptions = (regionSlug: string) =>
  queryOptions({
    queryKey: ['spaceFinder', 'areas', regionSlug] as const,
    queryFn: () => getSpaceFinderAreasFn({ data: { regionSlug } }),
  })

export const spaceFinderAreaQueryOptions = (areaId: number) =>
  queryOptions({
    queryKey: ['spaceFinder', 'area', areaId] as const,
    queryFn: () => getSpaceFinderAreaFn({ data: { areaId } }),
  })

export const spaceFinderVariantQueryOptions = (variantId: number) =>
  queryOptions({
    queryKey: ['spaceFinder', 'variant', variantId] as const,
    queryFn: () => getSpaceFinderVariantFn({ data: { variantId } }),
  })

export const spaceFinderJobQueryOptions = (jobId: number) =>
  queryOptions({
    queryKey: ['spaceFinder', 'job', jobId] as const,
    queryFn: () => getSpaceFinderJobFn({ data: { jobId } }),
  })

export const adminBoundariesQueryOptions = (regionSlug: string, query: string) =>
  queryOptions({
    queryKey: ['spaceFinder', 'adminBoundaries', regionSlug, query] as const,
    queryFn: () => getAdminBoundariesFn({ data: { regionSlug, query } }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 60,
  })

export const boundaryGeomQueryOptions = (regionSlug: string, boundaryId: string) =>
  queryOptions({
    queryKey: ['spaceFinder', 'boundaryGeom', boundaryId] as const,
    queryFn: () => getBoundaryGeomFn({ data: { regionSlug, boundaryId } }),
    staleTime: 1000 * 60 * 60,
  })
