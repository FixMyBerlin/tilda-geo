import { useSuspenseQuery } from '@tanstack/react-query'
import { useQaParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useQaParam'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { regionQaConfigsQueryOptions } from '@/server/regions/regionQueryOptions'

/** The region's QA configs and the one the URL selects; without `key` the first config. */
export const useActiveQaConfig = () => {
  const region = useRegion()
  const { qaParamData } = useQaParam()
  const { data: configs } = useSuspenseQuery(regionQaConfigsQueryOptions(region.slug))
  const selectedKey = qaParamData.key || configs[0]?.slug || ''
  const activeConfig = configs.find((config) => config.slug === selectedKey)

  return { configs, selectedKey, activeConfig }
}
