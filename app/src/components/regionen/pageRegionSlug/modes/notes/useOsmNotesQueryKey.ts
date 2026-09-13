import { osmNotesQueryKey } from './osmNotesQueryOptions'
import { useOsmNotesBbox } from './useOsmNotesBbox'

export const useOsmNotesQueryKey = () => osmNotesQueryKey(useOsmNotesBbox())
