import { getSourceData } from '@/components/regionen/pageRegionSlug/mapData/utils/getMapDataUtils'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import {
  calculatorDatasetsForCategories,
  calculatorLayerId,
  calculatorPartKey,
} from './calculatorDatasets.const'
import type { CalculatorFilter } from './calculatorModeParam'
import { useCalculatorModeParam } from './useCalculatorModeParam'

const isSameFilter = (a: CalculatorFilter, b: CalculatorFilter) =>
  Object.keys(a).length === Object.keys(b).length &&
  Object.entries(a).every(([key, value]) => b[key] === value)

/**
 * The datasets the region offers, the one that is summed right now (`sum.key`, else the first)
 * the filter on it (`sum.filter`, else the default filter of the dataset) and how its points are
 * colored (`sum.style`).
 */
export const useCalculatorDatasets = () => {
  const region = useRegion()
  const { calculatorMode, setCalculatorModeParam } = useCalculatorModeParam()

  const datasets = calculatorDatasetsForCategories(region.categories)
  const selected = datasets.find((dataset) => dataset.id === calculatorMode.key) ?? datasets[0]

  const parts = (selected?.parts ?? []).flatMap((part) => {
    const { calculator } = getSourceData(part.sourceId)
    return calculator.enabled ? [{ ...part, calculator }] : []
  })
  const hasParts = parts.length > 1
  // A group per tag of any part, the part itself first.
  const filterKeys = [
    ...new Set([
      ...(hasParts ? [calculatorPartKey] : []),
      ...parts.flatMap((part) => part.calculator.groupByKeys),
    ]),
  ]

  // Only keys the dataset groups by: a stale or hand-written key must not hide everything.
  const filter = Object.fromEntries(
    Object.entries(calculatorMode.filter ?? selected?.defaultFilter ?? {}).filter(([key]) =>
      filterKeys.includes(key),
    ),
  ) satisfies CalculatorFilter

  // Narrowed to one part, only its tags are broken down: the others are mostly missing there.
  const filteredPart = parts.find((part) => part.id === filter[calculatorPartKey])
  const groupByKeys = filteredPart
    ? filterKeys.filter(
        (key) => key === calculatorPartKey || filteredPart.calculator.groupByKeys.includes(key),
      )
    : filterKeys

  const activeDataset =
    selected && parts[0]
      ? {
          ...selected,
          parts,
          // The parts of a dataset are summed by the same keys; the first names them.
          sumKeys: parts[0].calculator.sumKeys,
          groupByKeys,
          queryLayers: parts.flatMap((part) =>
            part.layers.map((layer) => ({
              id: calculatorLayerId(selected.id, part.id, layer.id),
              part: part.id,
            })),
          ),
        }
      : undefined

  // Like the filter: only a key the dataset groups by.
  const style =
    calculatorMode.style && filterKeys.includes(calculatorMode.style)
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

  // The default filter is not part of the URL; without it, an empty filter has to be.
  const setFilter = (next: CalculatorFilter) =>
    setCalculatorModeParam({
      ...calculatorMode,
      filter: isSameFilter(next, selected?.defaultFilter ?? {}) ? undefined : next,
    })

  /** Sets the filter on a tag; the same value again removes it. */
  const toggleFilter = (key: string, value: string) => {
    const { [key]: current, ...rest } = filter
    setFilter(current === value ? rest : { ...rest, [key]: value })
  }

  const clearFilter = () => setFilter({})

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
