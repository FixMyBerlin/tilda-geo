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
    isOsmError,
    capabilities,
  } = useNotesModeListData()
  const visibleEntries = useVisibleNotesEntries(
    entries,
    showingOsm,
    capabilities.showExtentFilter ? (notesMode.extent ?? 'view') : undefined,
  )

  if (kind === 'none') return null
  if (kind === 'osm' && isOsmError) return null
  if (kind === 'internal' && isInternalError) return null
  if (kind === 'internal' && isInternalLoading) {
    return <ModeListCount count={{ status: 'loading' }} nouns={nouns} />
  }

  return <ModeListCount count={{ status: 'counted', shown: visibleEntries.length }} nouns={nouns} />
}
