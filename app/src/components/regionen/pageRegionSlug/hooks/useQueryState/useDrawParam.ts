import { createParser, useQueryState } from 'nuqs'
import type { DrawArea } from '@/components/regionen/pageRegionSlug/Map/Calculator/CalculatorControlsDrawControl'
import { searchParamsRegistry } from './searchParamsRegistry'
import { jsurlParse, jurlStringify } from './useCategoriesConfig/v1/jurlParseStringify'

const drawParamParser = createParser({
  parse: (query: string): DrawArea[] => {
    const parsed = jsurlParse(query)
    return Array.isArray(parsed) ? (parsed as DrawArea[]) : []
  },
  serialize: (value: DrawArea[]) => jurlStringify(value),
}).withOptions({ history: 'replace' })

export const useDrawParam = () => {
  const [drawParam, setDrawParam] = useQueryState(searchParamsRegistry.draw, drawParamParser)
  return { drawParam, setDrawParam }
}
