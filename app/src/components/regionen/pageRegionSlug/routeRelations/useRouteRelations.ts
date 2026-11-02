import { useQuery } from '@tanstack/react-query'
import { routeRelationsQueryOptions } from '@/server/route-relations/routeRelationsQueryOptions'
import { parseRouteRelations } from './routeRelations'

/**
 * The routes and pseudo relations of a feature (`route_relations`); OSM routes get name and ref
 * from the route tables once loaded.
 */
export const useRouteRelations = (value: string | undefined) => {
  const { routes, pseudo } = parseRouteRelations(value)
  const { data: details } = useQuery({
    ...routeRelationsQueryOptions(routes),
    enabled: routes.length > 0,
  })

  return {
    routes: routes.map(({ route, relationIds }) => ({
      route,
      relations: relationIds.map((relationId) => ({
        relationId,
        detail: details?.find((entry) => entry.route === route && entry.relationId === relationId),
      })),
    })),
    pseudo,
  }
}
