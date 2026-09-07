/**
 * The resolved selection in the notes mode. A discriminated union so consumers branch on `kind`
 * instead of re-checking region flags:
 * - `osm` → OSM notes
 * - `internal` → TILDA notes for the region
 * - `none` → nothing to show (e.g. internal-only region without membership)
 */
export type NotesSelection = { kind: 'osm' } | { kind: 'internal' } | { kind: 'none' }

const OSM_SELECTION: NotesSelection = { kind: 'osm' }
const INTERNAL_SELECTION: NotesSelection = { kind: 'internal' }
const NONE_SELECTION: NotesSelection = { kind: 'none' }

/**
 * A region has OSM notes or TILDA notes, not both. If both flags are somehow true, prefer TILDA.
 */
export const resolveNotesSelection = ({
  hasInternalNotes,
  hasOsmNotes,
}: {
  hasInternalNotes: boolean
  hasOsmNotes: boolean
}) => {
  if (hasInternalNotes) return INTERNAL_SELECTION
  if (hasOsmNotes) return OSM_SELECTION
  return NONE_SELECTION
}
