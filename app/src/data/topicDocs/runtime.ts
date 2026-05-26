import topicDocsByTableName from '@/data/generated/topicDocs/byTableName.gen'
import inspectorDescriptions from '@/data/generated/topicDocs/inspectorDescriptions.gen'
import masterportalByTableName from '@/data/generated/topicDocs/masterportalByTableName.gen'
import type { TopicDocMasterportalGfiConfig } from '@/data/topicDocs/masterportalGfi.types'

export type TopicDocCompiledValue = {
  readonly value: string
  readonly label: string
  description?: string
  readonly chapterRefs?: ReadonlyArray<string>
  readonly children?: ReadonlyArray<TopicDocCompiledValue>
}

export type TopicDocCompiledAttribute = {
  readonly key: string
  readonly type: 'string' | 'number' | 'sanitized_strings' | 'ignore'
  readonly label: string
  description?: string
  readonly chapterRefs?: ReadonlyArray<string>
  readonly values?: ReadonlyArray<TopicDocCompiledValue>
}

export type TopicDocCompiled = {
  readonly tableName: string
  readonly topic: string
  readonly sourceIds: ReadonlyArray<string>
  readonly title: string
  summary?: string
  readonly groups?: ReadonlyArray<{ readonly id: string; readonly label?: string }>
  readonly attributes: ReadonlyArray<TopicDocCompiledAttribute>
  readonly chapters: ReadonlyArray<{
    readonly id: string
    readonly title: string
    readonly markdown: string
  }>
}

type InspectorDescriptionMap = Record<
  string,
  {
    keys: Record<string, string>
    values: Record<string, Record<string, string>>
  }
>

const topicDocsByTableNameMap: Partial<Record<string, TopicDocCompiled>> = topicDocsByTableName
const masterportalByTableNameMap: Partial<Record<string, TopicDocMasterportalGfiConfig>> =
  masterportalByTableName
const inspectorDescriptionMap: Partial<InspectorDescriptionMap> = inspectorDescriptions

export const getTopicDocByTableName = (tableName: string) => {
  return topicDocsByTableNameMap[tableName] ?? null
}

export const getMasterportalByTableName = (tableName: string) => {
  return masterportalByTableNameMap[tableName] ?? null
}

const findValueDescription = (
  values: ReadonlyArray<TopicDocCompiledValue> | undefined,
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
  const sourceDescriptions = inspectorDescriptionMap[sourceId]
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
