import { registerInspectorMissingTranslation } from '@/components/regionen/pageRegionSlug/hooks/mapState/useInspectorMissingTranslationsState'
import { isDev } from '@/components/shared/utils/isEnv'
import { TagsTableRow } from '../TagsTableRow'
import { InspectorFormattedMessage } from '../translations/InspectorFormattedMessage'
import { translations } from '../translations/translations.const'
import { type TildaDescriptionPart, parseTildaDescription } from '../utils/parseTildaDescription'
import type { CompositTableRow } from './types'

export const tableKeyDescription = 'description'

/** Hint tokens are translated via the topic docs values of `description`; `{value}` is filled from the token. */
const DescriptionPart = ({ sourceId, part }: { sourceId: string; part: TildaDescriptionPart }) => {
  if (part.kind === 'osm') return <>{part.text}</>

  const translationKey = `${sourceId}--${tableKeyDescription}=${part.token}`
  const fallback = part.value === undefined ? part.token : `${part.token}=${part.value}`
  if (!translations[translationKey]) {
    registerInspectorMissingTranslation({ missing: translationKey })
  }
  return (
    <span title={isDev ? `(VALUE) ${translationKey}` : undefined}>
      <InspectorFormattedMessage
        id={translationKey}
        defaultMessage={fallback}
        values={{ value: part.value }}
      />
    </span>
  )
}

export const TagsTableRowDescription = ({ sourceId, tagKey, properties }: CompositTableRow) => {
  const description = properties[tagKey]
  if (!description) return null

  // Static datasets may hold a number or boolean here.
  const parts = parseTildaDescription(String(description))
  return (
    <TagsTableRow key={tagKey} sourceId={sourceId} tagKey={tagKey}>
      {parts.length === 1 && parts[0] ? (
        <DescriptionPart sourceId={sourceId} part={parts[0]} />
      ) : (
        <ul className="list-disc pl-3">
          {parts.map((part, index) => (
            <li key={part.kind === 'hint' ? part.token : `osm-${index}`}>
              <DescriptionPart sourceId={sourceId} part={part} />
            </li>
          ))}
        </ul>
      )}
    </TagsTableRow>
  )
}
