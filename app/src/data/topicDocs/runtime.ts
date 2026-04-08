import topicDocsByTableName from '@/data/generated/topicDocs/byTableName/index.gen.json'
import inspectorDescriptions from '@/data/generated/topicDocs/inspector/descriptions.gen.json'
import masterportalByTableName from '@/data/generated/topicDocs/masterportal/byTableName/index.gen.json'
import type { TopicDocMasterportalGfiConfig } from '@/data/topicDocs/masterportalGfi.types'

export type TopicDocCompiledValue = {
  value: string
  label: string
  description?: string
  chapterRefs?: Array<string>
  children?: Array<TopicDocCompiledValue>
}

export type TopicDocCompiledAttribute = {
  key: string
  type: 'string' | 'number' | 'sanitized_strings' | 'ignore'
  label: string
  description?: string
  chapterRefs?: Array<string>
  values?: Array<TopicDocCompiledValue>
}

export type TopicDocCompiled = {
  tableName: string
  topic: string
  sourceIds: Array<string>
  title: string
  summary?: string
  groups?: Array<{ id: string; label?: string }>
  attributes: Array<TopicDocCompiledAttribute>
  chapters: Array<{ id: string; title: string; markdown: string }>
}

type InspectorDescriptionMap = Record<
  string,
  {
    keys: Record<string, string>
    values: Record<string, Record<string, string>>
  }
>

export const getTopicDocByTableName = (tableName: string) => {
  const value = (topicDocsByTableName as Record<string, TopicDocCompiled | undefined>)[tableName]
  return value ?? null
}

export const getMasterportalByTableName = (tableName: string) => {
  const value = (
    masterportalByTableName as Record<string, TopicDocMasterportalGfiConfig | undefined>
  )[tableName]
  return value ?? null
}

const findValueDescription = (
  values: Array<TopicDocCompiledValue> | undefined,
  targetValue: string,
): string | undefined => {
  if (!values?.length) return undefined
  for (const valueNode of values) {
    if (valueNode.value === targetValue && valueNode.description) return valueNode.description
    const nested = findValueDescription(valueNode.children, targetValue)
    if (nested) return nested
  }
  return undefined
}

export const getDescriptionForInspectorTag = (
  sourceId: string,
  tagKey: string,
  tagValue: string | undefined,
) => {
  const sourceDescriptions = (inspectorDescriptions as InspectorDescriptionMap)[sourceId]
  if (sourceDescriptions) {
    const fromValue = tagValue ? sourceDescriptions.values[tagKey]?.[tagValue] : undefined
    if (fromValue) return fromValue
    const fromKey = sourceDescriptions.keys[tagKey]
    if (fromKey) return fromKey
  }

  const fallbackTable = sourceId.replace(/^tilda_/, '')
  const compiled = getTopicDocByTableName(fallbackTable)
  if (!compiled) return undefined

  const matchingAttribute = compiled.attributes.find((attribute) => attribute.key === tagKey)
  if (!matchingAttribute) return undefined
  if (tagValue) {
    const valueDescription = findValueDescription(matchingAttribute.values, tagValue)
    if (valueDescription) return valueDescription
  }
  return matchingAttribute.description
}
