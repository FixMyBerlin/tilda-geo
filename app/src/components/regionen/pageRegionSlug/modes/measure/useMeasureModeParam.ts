import { useSearch } from '@tanstack/react-router'
import { useRegionSearchNavigation } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useRegionSearchNavigation'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import {
  compactMeasureModeParam,
  zodMeasureModeParam,
  type MeasureModeParam,
} from './measureModeParam'

/** Read the Messen mode param (`measure` JSON). Route-agnostic so map layers can read it too. */
const useMeasureModeValue = () => {
  const value = useSearch({
    strict: false,
    select: (search) => search[searchParamsRegistry.measure],
  })
  return zodMeasureModeParam.safeParse(value).data ?? {}
}

/** Read/update the Messen mode param. Updates preserve other params and replace history. */
export const useMeasureModeParam = () => {
  const measureMode = useMeasureModeValue()
  const { updateSearch } = useRegionSearchNavigation()

  const setMeasureModeParam = (next: MeasureModeParam) => {
    updateSearch(
      { [searchParamsRegistry.measure]: compactMeasureModeParam(next) },
      { replace: true },
    )
  }

  return { measureMode, setMeasureModeParam }
}
