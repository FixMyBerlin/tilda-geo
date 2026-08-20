import { queryOptions } from '@tanstack/react-query'
import { getDataSchemaOverviewLoaderFn } from './dataSchema.functions'

export const dataSchemaOverviewQueryKey = ['admin', 'data-schema', 'overview'] as const

export const dataSchemaOverviewQueryOptions = () => {
  return queryOptions({
    queryKey: dataSchemaOverviewQueryKey,
    queryFn: () => getDataSchemaOverviewLoaderFn(),
  })
}
