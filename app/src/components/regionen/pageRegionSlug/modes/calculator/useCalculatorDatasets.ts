import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { calculatorDatasetsForCategories, calculatorLayerId } from './calculatorDatasets.const'
import type { CalculatorFilter } from './calculatorModeParam'
import { useCalculatorModeParam } from './useCalculatorModeParam'

/**
 * The datasets the region offers, the one that is summed right now (`sum.key`, else the first)
 * and the filter on it (`sum.filter`).
 */
export const useCalculatorDatasets = () => {
  const region = useRegion()
  const { calculatorMode, setCalculatorModeParam } = useCalculatorModeParam()

  const datasets = calculatorDatasetsForCategories(region.categories)
  const selected =
    datasets.find((dataset) => dataset.sourceId === calculatorMode.key) ?? datasets[0]
  const calculator = selected ? getSourceData(selected.sourceId).calculator : undefined

  const activeDataset =
    selected && calculator?.enabled
      ? {
          ...selected,
          sumKeys: calculator.sumKeys,
          groupByKeys: calculator.groupByKeys,
          queryLayers: selected.layers.map((layer) =>
            calculatorLayerId(selected.sourceId, layer.id),
          ),
        }
      : undefined

  // Only keys the dataset groups by: a stale or hand-written key must not hide everything.
  const filter = Object.fromEntries(
    Object.entries(calculatorMode.filter ?? {}).filter(([key]) =>
      activeDataset?.groupByKeys.includes(key),
    ),
  ) satisfies CalculatorFilter

  // Another dataset has other tags, so the filter does not carry over. The areas do.
  const selectDataset = (sourceId: string) =>
    setCalculatorModeParam({
      key: sourceId === datasets[0]?.sourceId ? undefined : sourceId,
      areas: calculatorMode.areas,
    })

  /** Sets the filter on a tag; the same value again removes it. */
  const toggleFilter = (key: string, value: string) => {
    const { [key]: current, ...rest } = filter
    setCalculatorModeParam({
      ...calculatorMode,
      filter: current === value ? rest : { ...rest, [key]: value },
    })
  }

  const clearFilter = () => setCalculatorModeParam({ ...calculatorMode, filter: undefined })

  return { datasets, activeDataset, selectDataset, filter, toggleFilter, clearFilter }
}
