import { useSearch } from '@tanstack/react-router'
import { useRegionSearchNavigation } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useRegionSearchNavigation'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import {
  compactSpaceFinderModeParam,
  zodSpaceFinderModeParam,
  type SpaceFinderModeParam,
} from './spaceFinderModeParam'

/**
 * Read/update the Flächenfinder mode param (`ff` JSON). `strict: false` keeps this route-agnostic
 * so map layers and the inspector can read it too, the same way the other modes do it.
 */
export const useSpaceFinderModeParam = () => {
  const value = useSearch({
    strict: false,
    select: (search) => search[searchParamsRegistry.ff],
  })
  const spaceFinderMode = zodSpaceFinderModeParam.safeParse(value).data ?? {}
  const { updateSearch } = useRegionSearchNavigation()

  const setSpaceFinderModeParam = (next: SpaceFinderModeParam) => {
    updateSearch(
      { [searchParamsRegistry.ff]: compactSpaceFinderModeParam(next) },
      { replace: true },
    )
  }

  return { spaceFinderMode, setSpaceFinderModeParam }
}
