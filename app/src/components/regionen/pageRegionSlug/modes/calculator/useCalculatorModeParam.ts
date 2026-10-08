import { useSearch } from '@tanstack/react-router'
import { useRegionSearchNavigation } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useRegionSearchNavigation'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import {
  compactCalculatorModeParam,
  zodCalculatorModeParam,
  type CalculatorModeParam,
} from './calculatorModeParam'

/** Read the Summieren mode param (`sum` JSON). Route-agnostic so map layers can read it too. */
const useCalculatorModeValue = () => {
  const value = useSearch({
    strict: false,
    select: (search) => search[searchParamsRegistry.sum],
  })
  return zodCalculatorModeParam.safeParse(value).data ?? {}
}

/** Read/update the Summieren mode param. Updates preserve other params and replace history. */
export const useCalculatorModeParam = () => {
  const calculatorMode = useCalculatorModeValue()
  const { updateSearch } = useRegionSearchNavigation()

  const setCalculatorModeParam = (next: CalculatorModeParam) => {
    updateSearch(
      { [searchParamsRegistry.sum]: compactCalculatorModeParam(next) },
      { replace: true },
    )
  }

  return { calculatorMode, setCalculatorModeParam }
}
