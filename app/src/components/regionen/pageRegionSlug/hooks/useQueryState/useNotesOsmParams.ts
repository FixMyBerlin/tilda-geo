import { createParser, parseAsBoolean, parseAsJson, useQueryState } from 'nuqs'
import { z } from 'zod'
import { searchParamsRegistry } from './searchParamsRegistry'
import { parseMapParam, serializeMapParam } from './utils/mapParam'

export const useShowOsmNotesParam = () => {
  const [showOsmNotesParam, setShowOsmNotesParam] = useQueryState(
    searchParamsRegistry.osmNotes,
    parseAsBoolean.withDefault(false),
  )
  return { showOsmNotesParam, setShowOsmNotesParam }
}

const newOsmNoteMapParamParser = createParser({
  parse: (query) => parseMapParam(query),
  serialize: (object) => serializeMapParam(object),
}).withOptions({
  history: 'replace',
  // Bugfix: Firefox breaks when zooming via scrool wheel due to too many events
  throttleMs: 1000,
})

export const useNewOsmNoteMapParam = () => {
  const [newOsmNoteMapParam, setNewOsmNoteMapParam] = useQueryState(
    searchParamsRegistry.osmNote,
    newOsmNoteMapParamParser,
  )
  return { newOsmNoteMapParam, setNewOsmNoteMapParam }
}

export const zodOsmFilterParam = z.object({
  query: z.string().optional().nullable(),
  completed: z.boolean().optional().nullable(),
  user: z.string().optional().nullable(),
  commented: z.boolean().optional().nullable(),
})

export const useOsmFilterParam = () => {
  const [osmNotesFilterParam, setOsmNotesFilterParam] = useQueryState(
    searchParamsRegistry.osmNotesFilter,
    parseAsJson(zodOsmFilterParam.parse),
  )
  return { osmNotesFilterParam, setOsmNotesFilterParam }
}
