/** List-row id written by NotesModeList / ModeDataTable. */
export const notesListItemId = (sourceId: string, id: number) => `note-${sourceId}-${id}`

/** Numeric note id from a hovered list-row id, or null when the row is not this source. */
export const parseNotesListHoverId = (hoveredListItemId: string | undefined, sourceId: string) => {
  if (!hoveredListItemId) return null
  const prefix = `note-${sourceId}-`
  if (!hoveredListItemId.startsWith(prefix)) return null
  const id = Number(hoveredListItemId.slice(prefix.length))
  return Number.isFinite(id) ? id : null
}
