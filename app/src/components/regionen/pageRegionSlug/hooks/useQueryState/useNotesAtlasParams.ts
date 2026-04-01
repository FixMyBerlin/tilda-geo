import { createParser, parseAsBoolean, parseAsJson, useQueryState } from 'nuqs'
import { z } from 'zod'
import { searchParamsRegistry } from './searchParamsRegistry'
import { parseMapParam, serializeMapParam } from './utils/mapParam'

export const useShowInternalNotesParam = () => {
  const [showInternalNotesParam, setShowInternalNotesParam] = useQueryState(
    searchParamsRegistry.atlasNotes,
    parseAsBoolean.withDefault(false),
  )
  return { showInternalNotesParam, setShowInternalNotesParam }
}

const newInternalNoteMapParamParser = createParser({
  parse: (query) => parseMapParam(query),
  serialize: (object) => serializeMapParam(object),
}).withOptions({
  history: 'replace',
  // Bugfix: Firefox breaks when zooming via scrool wheel due to too many events
  throttleMs: 1000,
})

export const useNewInternalNoteMapParam = () => {
  const [newInternalNoteMapParam, setNewInternalNoteMapParam] = useQueryState(
    searchParamsRegistry.atlasNote,
    newInternalNoteMapParamParser,
  )
  return { newInternalNoteMapParam, setNewInternalNoteMapParam }
}

export const zodInternalNotesFilterParam = z.object({
  query: z.string().optional().nullable(),
  completed: z.boolean().optional().nullable(),
  user: z.string().optional().nullable(),
  commented: z.boolean().optional().nullable(),
  notReacted: z.boolean().optional().nullable(),
})

export const useInternalNotesFilterParam = () => {
  const [internalNotesFilterParam, setInternalNotesFilterParam] = useQueryState(
    searchParamsRegistry.atlasNotesFilter,
    parseAsJson(zodInternalNotesFilterParam.parse).withOptions({
      shallow: false, // Trigger server re-render when filter changes
    }),
  )
  return { internalNotesFilterParam, setInternalNotesFilterParam }
}
