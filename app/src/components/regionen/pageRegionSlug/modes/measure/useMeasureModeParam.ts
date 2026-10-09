import { useRegionSearchNavigation } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useRegionSearchNavigation'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { compactMeasureModeParam, type MeasureModeParam } from './measureModeParam'

const emptyMeasureMode: MeasureModeParam = {}

/**
 * Read/update the Messen mode param (`measure`), as the region route validated it. Updates
 * preserve other params and replace history.
 */
export const useMeasureModeParam = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const measureMode = search[searchParamsRegistry.measure] ?? emptyMeasureMode

  const setMeasureModeParam = (next: MeasureModeParam) => {
    updateSearch(
      { [searchParamsRegistry.measure]: compactMeasureModeParam(next) },
      { replace: true },
    )
  }

  return { measureMode, setMeasureModeParam }
}
