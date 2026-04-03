import { createParser, useQueryState } from 'nuqs'
import type { DrawArea } from '@/components/regionen/pageRegionSlug/Map/Calculator/drawing/drawAreaTypes'
import { searchParamsRegistry } from './searchParamsRegistry'
import { jsurlParse, jurlStringify } from './useCategoriesConfig/v1/jurlParseStringify'

const calculatorDrawParser = createParser({
  parse: (query: string): DrawArea[] => {
    const parsed = jsurlParse(query)
    return Array.isArray(parsed) ? (parsed as DrawArea[]) : []
  },
  serialize: (value: DrawArea[]) => jurlStringify(value),
}).withOptions({
  history: 'replace',
  // Drag/edit emits rapid change events; throttle URL commits for smoother interaction.
  limitUrlUpdates: {
    method: 'throttle',
    timeMs: 2000,
  },
})

export const useDrawSession = () => {
  const [drawAreas, setDrawAreasRaw] = useQueryState(
    searchParamsRegistry.draw,
    calculatorDrawParser.withDefault([]),
  )

  return {
    drawAreas,
    setDrawAreas: (areas: DrawArea[]) => {
      void setDrawAreasRaw(areas)
    },
  }
}
