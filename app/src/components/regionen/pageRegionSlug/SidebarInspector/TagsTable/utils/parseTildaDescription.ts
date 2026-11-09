export type TildaDescriptionPart =
  | { kind: 'hint'; token: string; value: string | undefined }
  | { kind: 'osm'; text: string }

const OSM_DESCRIPTION_PREFIX = 'OSM-`description`: '
const OSM_NOTE_PREFIX = 'OSM-`note`: '

/**
 * Parses the `description` that processing writes for roads, paths and bikelanes
 * (`processing/topics/helper/tilda_description.lua`):
 * `TILDA_<hint>=<value>;TILDA_<hint>;OSM-\`description\`: <text>;OSM-\`note\`: <text>`.
 * Everything after the hint tokens is OSM text, which may contain `;` itself;
 * the `note` text starts at its prefix. A description without tokens and prefixes (other datasets) is one OSM text.
 */
export const parseTildaDescription = (description: string): TildaDescriptionPart[] => {
  const parts: TildaDescriptionPart[] = []
  let rest = description

  while (rest.startsWith('TILDA_')) {
    const end = rest.indexOf(';')
    const token = end === -1 ? rest : rest.slice(0, end)
    const [name = token, ...value] = token.split('=')
    parts.push({ kind: 'hint', token: name, value: value.length ? value.join('=') : undefined })
    rest = end === -1 ? '' : rest.slice(end + 1)
  }

  if (rest.startsWith(OSM_NOTE_PREFIX)) {
    parts.push({ kind: 'osm', text: rest.slice(OSM_NOTE_PREFIX.length) })
    return parts
  }

  const noteStart = rest.indexOf(`;${OSM_NOTE_PREFIX}`)
  const descriptionText = noteStart === -1 ? rest : rest.slice(0, noteStart)
  if (descriptionText) {
    const text = descriptionText.startsWith(OSM_DESCRIPTION_PREFIX)
      ? descriptionText.slice(OSM_DESCRIPTION_PREFIX.length)
      : descriptionText
    parts.push({ kind: 'osm', text })
  }
  if (noteStart !== -1) {
    parts.push({ kind: 'osm', text: rest.slice(noteStart + 1 + OSM_NOTE_PREFIX.length) })
  }
  return parts
}
