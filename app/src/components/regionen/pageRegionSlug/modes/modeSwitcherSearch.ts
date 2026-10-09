import type { RegionSearch } from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { CALCULATOR_AREA_PRECISION } from './calculator/calculatorModeParam'
import { roundAreasParam } from './drawAreasParam'
import type { RegionMode } from './useCurrentMode'

/**
 * Mode switcher links keep the previous search object. Mode-scoped keys (`notes.new`,
 * `review.new` / `review.move`, mode-owned `f` features) are stripped by each mode route's
 * `search.middlewares`.
 *
 * One thing is added: areas drawn in Summieren are taken over to Messen and back, when the
 * mode that is opened (`to`, another one than the current `from`) has no areas yet. It is a copy made at the moment of the switch;
 * afterwards the two modes change their areas independently. Lines are never taken over.
 */
export const modeSwitcherSearch = <T extends Partial<RegionSearch>>(
  { from, to }: { from: RegionMode; to: RegionMode },
  prev: T,
) => {
  if (from === to) return prev
  const sum = prev[searchParamsRegistry.sum]
  const measure = prev[searchParamsRegistry.measure]

  if (to === 'measure' && sum?.areas && !measure?.areas) {
    return { ...prev, [searchParamsRegistry.measure]: { ...measure, areas: sum.areas } }
  }
  if (to === 'calculator' && measure?.areas && !sum?.areas) {
    // Summieren keeps its areas on a coarser grid.
    const areas = roundAreasParam(measure.areas, CALCULATOR_AREA_PRECISION)
    return { ...prev, [searchParamsRegistry.sum]: { ...sum, areas } }
  }
  return prev
}
