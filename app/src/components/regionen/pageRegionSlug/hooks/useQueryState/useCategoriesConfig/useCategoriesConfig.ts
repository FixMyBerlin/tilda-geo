import { createParser, useQueryState } from 'nuqs'
import { useStaticRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useStaticRegion'
import { searchParamsRegistry } from '../searchParamsRegistry'
import { createFreshCategoriesConfig } from './createFreshCategoriesConfig'
import type { MapDataCategoryConfig } from './type'
import { parse } from './v2/parse'
import { serialize } from './v2/serialize'

export const useCategoriesConfig = () => {
  const region = useStaticRegion()
  const freshConfig = createFreshCategoriesConfig(region?.categories ?? [])

  const configParamParser = createParser({
    parse: (query: string) => parse(query, freshConfig),
    serialize: (value: MapDataCategoryConfig[]) => serialize(value),
  })
    .withOptions({ history: 'push' })
    .withDefault(freshConfig)

  const [categoriesConfig, setCategoriesConfig] = useQueryState(
    searchParamsRegistry.config,
    configParamParser,
  )

  return { categoriesConfig, setCategoriesConfig }
}
