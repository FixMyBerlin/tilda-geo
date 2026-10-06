import type { DrawArea } from '@/components/regionen/pageRegionSlug/Map/Calculator/drawing/drawAreaTypes'
import { getDrawAreasFromSearch, serializeDrawParam } from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { useRegionSearchNavigation } from './useRegionSearchNavigation'

export const useDrawSession = () => {
  const { search, updateSearch } = useRegionSearchNavigation()
  const drawAreas = getDrawAreasFromSearch(search)

  // Not throttled: `drawAreas` is read back from the URL, so a delayed write hands callers a
  // stale value. Callers pass settled edits only (see CalculatorMapDrawingControl).
  const setDrawAreas = (areas: DrawArea[]) => {
    updateSearch({ [searchParamsRegistry.draw]: serializeDrawParam(areas) }, { replace: true })
  }

  return { drawAreas, setDrawAreas }
}
