import { skipToken, useQuery } from '@tanstack/react-query'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { STALE_TIME_LONG_CACHE_MS } from '@/config/queryStaleTimes'
import { getCalculatorSumsFn } from '@/server/calculator/calculator.functions'
import { useCalculatorDatasets } from './useCalculatorDatasets'
import { useCalculatorModeParam } from './useCalculatorModeParam'

/**
 * The sums of the selected dataset inside the drawn areas, computed on the server. Follows
 * `sum.areas`, so it is asked once per finished edit; filter, style and metric work on the rows
 * it returned. While new areas are summed, the rows of the areas before stay.
 */
export const useCalculatorQuery = () => {
  const regionSlug = useRegionSlug()
  const { activeDataset } = useCalculatorDatasets()
  const { areas } = useCalculatorModeParam().calculatorMode
  const datasetId = activeDataset?.id

  return useQuery({
    queryKey: ['calculatorSums', regionSlug, datasetId, areas] as const,
    queryFn:
      datasetId && areas
        ? () => getCalculatorSumsFn({ data: { regionSlug, datasetId, areas } })
        : skipToken,
    staleTime: STALE_TIME_LONG_CACHE_MS,
    // Rows of another dataset have other tags, so only the rows of the same dataset stay.
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === datasetId ? previousData : undefined,
  })
}
