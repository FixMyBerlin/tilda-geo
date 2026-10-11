import { queryOptions } from '@tanstack/react-query'
import { getMapLayerOrderFn } from './map-layer-order.functions'

export const mapLayerOrderQueryOptions = () => {
  return queryOptions({
    queryKey: ['mapLayerOrder'] as const,
    queryFn: () => getMapLayerOrderFn(),
    // The order changes rarely (admin edits); keep it stable for the session so the
    // layer mount order never reshuffles mid-session.
    staleTime: Infinity,
  })
}
