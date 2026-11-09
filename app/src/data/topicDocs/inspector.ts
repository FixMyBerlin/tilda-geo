// Topic doc lookups for the map page. They read the slim generated files only, so the map does
// not load the full docs in `byTableName.gen.ts` (see `runtime.ts` for those).
import inspectorAttributes from '@/data/generated/topicDocs/inspectorAttributes.gen'
import inspectorDescriptions from '@/data/generated/topicDocs/inspectorDescriptions.gen'
import titlesByTableName from '@/data/generated/topicDocs/titlesByTableName.gen'
import type {
  TopicDocAttributeFormat,
  TopicDocAttributePurpose,
  TopicDocNumericFormat,
} from '@/data/topicDocs/schema'
import { topicDocNumericFormatSet } from '@/data/topicDocs/schema'

export type TopicDocInspectorAttributes = Record<
  string,
  Record<string, { type: TopicDocAttributeFormat; purpose?: TopicDocAttributePurpose }>
>

type InspectorDescriptionMap = Record<
  string,
  {
    keys: Record<string, string>
    values: Record<string, Record<string, string>>
  }
>

const inspectorAttributeMap: Partial<TopicDocInspectorAttributes> = inspectorAttributes
const inspectorDescriptionMap: Partial<InspectorDescriptionMap> = inspectorDescriptions
const titleMap: Partial<Record<string, string>> = titlesByTableName

export const getInspectorTagKeyCandidates = (tagKey: string) => {
  const withoutOsmPrefix = tagKey.startsWith('osm_') ? tagKey.slice(4) : tagKey
  const normalizedDateVariant = withoutOsmPrefix.replaceAll(':', '_')

  if (normalizedDateVariant === withoutOsmPrefix) {
    return [tagKey, withoutOsmPrefix]
  }

  return [tagKey, withoutOsmPrefix, normalizedDateVariant]
}

/** Title of the topic doc for this table, or `null` when the table has no topic doc. */
export const getTopicDocTitle = (tableName: string) => {
  return titleMap[tableName] ?? null
}

export const isNumericTopicDocFormat = (
  format: TopicDocAttributeFormat,
): format is TopicDocNumericFormat => {
  return topicDocNumericFormatSet.has(format)
}

const getInspectorAttribute = (sourceId: string, tagKey: string) => {
  const sourceAttributes = inspectorAttributeMap[sourceId]
  if (!sourceAttributes) return null

  for (const candidate of getInspectorTagKeyCandidates(tagKey)) {
    const match = sourceAttributes[candidate]
    if (match) return match
  }
  return null
}

export const getInspectorAttributeFormat = (sourceId: string, tagKey: string) => {
  return getInspectorAttribute(sourceId, tagKey)?.type ?? null
}

export const getInspectorAttributePurpose = (sourceId: string, tagKey: string) => {
  return getInspectorAttribute(sourceId, tagKey)?.purpose ?? null
}

type InspectorTagValue = string | boolean | number | null | undefined

export const formatInspectorTagValue = (tagValue: InspectorTagValue) => {
  switch (typeof tagValue) {
    case 'undefined':
    case 'object': // null
      return undefined
    case 'string':
      return tagValue
    case 'boolean':
    case 'number':
      return String(tagValue)
    case 'bigint': {
      throw new Error('Not implemented yet: "bigint" case')
    }
    case 'function': {
      throw new Error('Not implemented yet: "function" case')
    }
    case 'symbol': {
      throw new Error('Not implemented yet: "symbol" case')
    }
  }
}

export const getInspectorValueTranslationKey = (
  sourceId: string,
  tagKey: string,
  tagValue: InspectorTagValue,
) => {
  const formattedValue = formatInspectorTagValue(tagValue)
  if (!formattedValue) return undefined
  return `${sourceId}--${tagKey}=${formattedValue}`
}

export const getDescriptionForInspectorTag = (
  sourceId: string,
  tagKey: string,
  tagValue: InspectorTagValue,
) => {
  const sourceDescriptions = inspectorDescriptionMap[sourceId]
  if (!sourceDescriptions) return undefined

  const formattedValue = formatInspectorTagValue(tagValue)
  if (formattedValue) {
    const fromValue = sourceDescriptions.values[tagKey]?.[formattedValue]
    if (fromValue) return fromValue
  }
  return sourceDescriptions.keys[tagKey]
}
