export const NOTES_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'open', label: 'Offen' },
  { value: 'closed', label: 'Erledigt' },
] as const

export const NOTES_COMMENTED_FILTER_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'yes', label: 'Mit Kommentar' },
  { value: 'no', label: 'Ohne Kommentar' },
] as const

export const NOTES_REACTION_FILTER_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'notReacted', label: 'Keine eigene' },
  { value: 'reacted', label: 'Eigene Reaktion' },
] as const

type NotesAuthorOption = { value: string; label: string }

type InternalAuthor = {
  id: string
  osmName?: string | null
  firstName?: string | null
  currentUser?: boolean
}

/**
 * Autor:in options: Alle, Meine (when the current user is known), then other authors.
 * OSM uses `comments[0].user` names; internal uses author cuids — never mixed.
 */
export const notesAuthorFilterOptions = ({
  authors,
  osmAuthorNames,
  myValue,
}: {
  authors: InternalAuthor[]
  osmAuthorNames: string[]
  myValue: string | undefined
}) => {
  const options: NotesAuthorOption[] = [{ value: '', label: 'Alle' }]
  if (myValue) options.push({ value: myValue, label: 'Meine' })

  if (osmAuthorNames.length > 0) {
    for (const name of osmAuthorNames) {
      if (name === myValue) continue
      options.push({ value: name, label: name })
    }
    return options
  }

  for (const author of authors) {
    if (author.id === myValue) continue
    options.push({
      value: author.id,
      label: author.osmName || author.firstName || author.id,
    })
  }
  return options
}

export const uniqueOsmNoteAuthorNames = (
  features: { properties: { comments: { user?: string }[] } }[],
) => {
  const names = new Set<string>()
  for (const feature of features) {
    const name = feature.properties.comments[0]?.user
    if (name) names.add(name)
  }
  return [...names]
}

export const notesStatusFilterValue = (completed: boolean | undefined) => {
  if (completed === true) return 'closed'
  if (completed === false) return 'open'
  return 'all'
}

export const notesCommentedFilterValue = (commented: boolean | undefined) => {
  if (commented === true) return 'yes'
  if (commented === false) return 'no'
  return 'all'
}

export const notesReactionFilterValue = (notReacted: boolean | undefined) => {
  if (notReacted === true) return 'notReacted'
  if (notReacted === false) return 'reacted'
  return 'all'
}
