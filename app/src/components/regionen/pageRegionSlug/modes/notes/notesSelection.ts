import { notesOsmCollectionKey, type NotesCollectionKey } from './notesModeParam'

/**
 * The resolved selection in the notes mode. A discriminated union so consumers branch on `kind`
 * instead of re-checking region flags:
 * - `osm` → OSM notes
 * - `internal` → TILDA notes for the active folder
 * - `none` → nothing to show (e.g. internal-only region without membership)
 */
export type NotesSelection = { kind: 'osm' } | { kind: 'internal' } | { kind: 'none' }

const OSM_SELECTION: NotesSelection = { kind: 'osm' }
const INTERNAL_SELECTION: NotesSelection = { kind: 'internal' }
const NONE_SELECTION: NotesSelection = { kind: 'none' }

/**
 * OSM and TILDA notes are independent flags. When both are on, `key === 'osm'` selects the
 * virtual OSM folder; any other key (including omitted) selects TILDA. A stale `'osm'` on an
 * internal-only region falls back to TILDA; a stale folder id on an OSM-only region stays OSM.
 */
export const resolveNotesSelection = ({
  hasInternalNotes,
  hasOsmNotes,
  key,
}: {
  hasInternalNotes: boolean
  hasOsmNotes: boolean
  key?: NotesCollectionKey
}) => {
  if (hasOsmNotes && (!hasInternalNotes || key === notesOsmCollectionKey)) {
    return OSM_SELECTION
  }
  if (hasInternalNotes) return INTERNAL_SELECTION
  return NONE_SELECTION
}

/**
 * URL `notes.key` after picking a collection. OSM-only omits the key. When TILDA folders
 * exist, the first folder is omitted; OSM is written as `'osm'` only if TILDA is also on.
 */
export const compactNotesCollectionKey = ({
  selected,
  firstFolderId,
  hasOsmAndInternal,
}: {
  selected: NotesCollectionKey
  firstFolderId: number | undefined
  hasOsmAndInternal: boolean
}) => {
  if (selected === notesOsmCollectionKey) {
    return hasOsmAndInternal ? notesOsmCollectionKey : undefined
  }
  return selected === firstFolderId ? undefined : selected
}

/**
 * The active note folder id from `notesMode.key`, falling back to the first (oldest) folder when
 * `key` is absent or points at a folder that no longer exists/is linked to this region (stale
 * bookmark, deleted folder). `'osm'` is not a folder id. `folders` is oldest-first
 * (`orderBy: createdAt asc`).
 */
export const resolveSelectedNoteFolderId = (
  key: NotesCollectionKey | undefined,
  folders: { id: number }[],
) => {
  if (key === notesOsmCollectionKey) return undefined
  return folders.some((folder) => folder.id === key) ? key : folders[0]?.id
}
