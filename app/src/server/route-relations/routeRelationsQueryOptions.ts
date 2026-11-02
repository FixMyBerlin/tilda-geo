import { queryOptions } from '@tanstack/react-query'
import type { RouteRelationGroup } from '@/components/regionen/pageRegionSlug/routeRelations/routeRelations'
import { getRouteRelationsFn } from './route-relations.functions'

export const routeRelationsQueryOptions = (groups: RouteRelationGroup[]) => {
  return queryOptions({
    queryKey: ['routeRelations', groups] as const,
    queryFn: () => getRouteRelationsFn({ data: { groups } }),
    // Route relations change with the nightly processing at most.
    staleTime: 60 * 60 * 1000,
  })
}
