import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { calculatorDatasetsForCategories, calculatorLayerId } from './calculatorDatasets.const'
import type { CalculatorFilter } from './calculatorModeParam'
import { useCalculatorModeParam } from './useCalculatorModeParam'

/**
 * The datasets the region offers, the one that is summed right now (`sum.key`, else the first)
 * the filter on it (`sum.filter`) and how its points are colored (`sum.style`).
 */
export const useCalculatorDatasets = () => {
  const region = useRegion()
  const { calculatorMode, setCalculatorModeParam } = useCalculatorModeParam()

  const datasets = calculatorDatasetsForCategories(region.categories)
  const selected = datasets.find((dataset) => dataset.id === calculatorMode.key) ?? datasets[0]
  const calculator = selected ? getSourceData(selected.sourceId).calculator : undefined

  const activeDataset =
    selected && calculator?.enabled
      ? {
          ...selected,
          sumKeys: calculator.sumKeys,
          groupByKeys: calculator.groupByKeys.filter((key) => !(key in selected.where)),
          queryLayers: selected.layers.map((layer) => calculatorLayerId(selected.id, layer.id)),
        }
      : undefined

  // Only keys the dataset groups by: a stale or hand-written key must not hide everything.
  const filter = Object.fromEntries(
    Object.entries(calculatorMode.filter ?? {}).filter(([key]) =>
      activeDataset?.groupByKeys.includes(key),
    ),
  ) satisfies CalculatorFilter

  // Like the filter: only a key the dataset groups by.
  const style =
    calculatorMode.style && activeDataset?.groupByKeys.includes(calculatorMode.style)
      ? calculatorMode.style
      : undefined

  const setStyle = (key: string | undefined) =>
    setCalculatorModeParam({ ...calculatorMode, style: key })

  // Another dataset has other tags, so filter and style do not carry over. The areas do.
  const selectDataset = (id: string) =>
    setCalculatorModeParam({
      key: id === datasets[0]?.id ? undefined : id,
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

  return {
    datasets,
    activeDataset,
    selectDataset,
    filter,
    toggleFilter,
    clearFilter,
    style,
    setStyle,
  }
}
