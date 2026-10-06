/** List-row id written by NotesModeList / ModeDataTable. */
export const notesListItemId = (sourceId: string, id: string | number) => `note-${sourceId}-${id}`

/** Numeric note id from a hovered list-row id, or null when the row is not this source. */
export const parseNotesListHoverId = (hoveredListItemId: string | undefined, sourceId: string) => {
  if (!hoveredListItemId) return null
  const prefix = `note-${sourceId}-`
  if (!hoveredListItemId.startsWith(prefix)) return null
  const id = Number(hoveredListItemId.slice(prefix.length))
  return Number.isFinite(id) ? id : null
}

/** Selection plus list-hover and map-hover ids for `${layerId}-highlight`. */
export const notesHighlightIds = (
  selectedIds: number[],
  hoveredListItemId: string | undefined,
  hoveredMapItemId: string | null | undefined,
  sourceId: string,
) => {
  const hoverIds = [hoveredListItemId, hoveredMapItemId ?? undefined]
    .map((id) => parseNotesListHoverId(id, sourceId))
    .filter((id): id is number => id != null)
  return [...selectedIds, ...hoverIds]
}
