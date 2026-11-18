import { ModeListCount, type ModeListCountNouns } from '../ModeListCount'
import { useNotesModeListData } from './useNotesModeListData'
import { useNotesModeParam } from './useNotesModeParam'
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

  return <ModeListCount count={{ status: 'counted', shown: visibleEntries.length }} nouns={nouns} />
}
