import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import {
  calculatorDatasetsForCategories,
  calculatorFilterKeys,
  calculatorPartKey,
} from './calculatorDatasets.const'
import {
  type CalculatorFilter,
  calculatorFilterFromParam,
  calculatorFilterToParam,
} from './calculatorModeParam'
import { useCalculatorModeParam } from './useCalculatorModeParam'

const isSameFilter = (a: CalculatorFilter, b: CalculatorFilter) =>
  Object.keys(a).length === Object.keys(b).length &&
  Object.entries(a).every(
    ([key, values]) =>
      values.length === b[key]?.length && values.every((value) => b[key]?.includes(value)),
  )

/**
 * The datasets the region offers, the one that is summed right now (`sum.key`, else the first)
 * the filter on it (`sum.filter`, else the default filter of the dataset) and how its features are
 * colored (`sum.style`).
 */
export const useCalculatorDatasets = () => {
  const region = useRegion()
  const { calculatorMode, setCalculatorModeParam } = useCalculatorModeParam()

  const datasets = calculatorDatasetsForCategories(region.categories)
  const selected = datasets.find((dataset) => dataset.id === calculatorMode.key) ?? datasets[0]

  const filterKeys = selected ? calculatorFilterKeys(selected) : []

  // Only keys the dataset groups by: a stale or hand-written key must not hide everything.
  const filter = Object.fromEntries(
    Object.entries(
      calculatorMode.filter
        ? calculatorFilterFromParam(calculatorMode.filter)
        : (selected?.defaultFilter ?? {}),
    ).filter(([key]) => filterKeys.includes(key)),
  ) satisfies CalculatorFilter

  // Narrowed to some parts, only their tags are broken down: the others are mostly missing there.
  const filteredParts =
    selected?.parts.filter((part) => filter[calculatorPartKey]?.includes(part.id)) ?? []
  const groupByKeys =
    filteredParts.length > 0
      ? filterKeys.filter(
          (key) =>
            key === calculatorPartKey ||
            filteredParts.some((part) => part.groupByKeys.includes(key)),
        )
      : filterKeys

  const activeDataset = selected ? { ...selected, groupByKeys } : undefined

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
      filter: isSameFilter(next, selected?.defaultFilter ?? {})
        ? undefined
        : calculatorFilterToParam(next),
    })

  /** Adds a value to the filter on a tag; the same value again removes it. */
  const toggleFilter = (key: string, value: string) => {
    const { [key]: current = [], ...rest } = filter
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value]
    setFilter(next.length > 0 ? { ...rest, [key]: next } : rest)
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
