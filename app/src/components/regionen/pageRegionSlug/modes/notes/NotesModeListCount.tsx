import { ModeListCount, type ModeListCountNouns } from '../ModeListCount'
import { osmNotesHitBboxLimit } from './osmNotesQueryOptions'
import { useNotesModeListData } from './useNotesModeListData'
import { useNotesModeParam } from './useNotesModeParam'
import { useOsmNotesQuery } from './useOsmNotesQuery'
import { useVisibleNotesEntries } from './useVisibleNotesEntries'

const nouns = {
  singular: 'Hinweis',
  plural: 'Hinweise',
  pluralDative: 'Hinweisen',
} satisfies ModeListCountNouns

export const NotesModeListCount = () => {
  const { notesMode } = useNotesModeParam()
  const {
    kind,
    showingOsm,
    entries,
    isInternalLoading,
    isInternalError,
    isOsmLoading,
    isOsmError,
    capabilities,
  } = useNotesModeListData()
  const { data: osmNotes } = useOsmNotesQuery()
  const visibleEntries = useVisibleNotesEntries(
    entries,
    showingOsm,
    capabilities.showExtentFilter ? (notesMode.extent ?? 'view') : undefined,
  )

  if (kind === 'none') return null
  if (showingOsm ? isOsmError : isInternalError) return null
  if (showingOsm ? isOsmLoading : isInternalLoading) {
    return <ModeListCount count={{ status: 'loading' }} nouns={nouns} />
  }

  const shown = visibleEntries.length
  const osmHitLimit = showingOsm && osmNotesHitBboxLimit(osmNotes?.features.length ?? 0)
  return (
    <ModeListCount
      count={osmHitLimit ? { status: 'atLeast', shown } : { status: 'counted', shown }}
      nouns={nouns}
    />
  )
}
