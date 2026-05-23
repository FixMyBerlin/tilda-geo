import topicDocsByTableName from '@/data/generated/topicDocs/byTableName.gen'
import inspectorDescriptions from '@/data/generated/topicDocs/inspectorDescriptions.gen'
import masterportalByTableName from '@/data/generated/topicDocs/masterportalByTableName.gen'
import type { TopicDocMasterportalGfiConfig } from '@/data/topicDocs/masterportalGfi.types'
import type { TopicDocAttributeFormat } from '@/data/topicDocs/schema'
import type { TopicDocAttributePurpose } from '@/data/topicDocs/schema'
import { topicDocNumericFormatSet } from '@/data/topicDocs/schema'
import type { TopicDocNumericFormat } from '@/data/topicDocs/schema'

export type TopicDocCompiledValue = {
  readonly value: string
  readonly label: string
  description?: string
  readonly chapterRefs?: ReadonlyArray<string>
}

export type TopicDocCompiledAttribute = {
  readonly key: string
  readonly type: TopicDocAttributeFormat
  readonly label: string
  readonly purpose?: TopicDocAttributePurpose
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
const sourceAttributeFormats = new Map<string, Map<string, TopicDocCompiledAttribute['type']>>()
const keyAttributeFormats = new Map<string, Set<TopicDocCompiledAttribute['type']>>()
const sourceAttributePurposes = new Map<string, Map<string, TopicDocAttributePurpose>>()

const getInspectorTagKeyCandidates = (tagKey: string) => {
  const withoutOsmPrefix = tagKey.startsWith('osm_') ? tagKey.slice(4) : tagKey
  const normalizedDateVariant = withoutOsmPrefix.replaceAll(':', '_')

  if (normalizedDateVariant === withoutOsmPrefix) {
    return [tagKey, withoutOsmPrefix]
  }

  return [tagKey, withoutOsmPrefix, normalizedDateVariant]
}

for (const doc of Object.values(topicDocsByTableNameMap)) {
  if (!doc) continue
  for (const attribute of doc.attributes) {
    const knownFormats = keyAttributeFormats.get(attribute.key) ?? new Set()
    knownFormats.add(attribute.type)
    keyAttributeFormats.set(attribute.key, knownFormats)
  }

  for (const sourceId of doc.sourceIds) {
    const byKey = sourceAttributeFormats.get(sourceId) ?? new Map()
    const purposeByKey = sourceAttributePurposes.get(sourceId) ?? new Map()
    for (const attribute of doc.attributes) {
      if (!byKey.has(attribute.key)) {
        byKey.set(attribute.key, attribute.type)
      }
      if (attribute.purpose && !purposeByKey.has(attribute.key)) {
        purposeByKey.set(attribute.key, attribute.purpose)
      }
    }
    sourceAttributeFormats.set(sourceId, byKey)
    sourceAttributePurposes.set(sourceId, purposeByKey)
  }
}

export const getTopicDocByTableName = (tableName: string) => {
  return topicDocsByTableNameMap[tableName] ?? null
}

export const getMasterportalByTableName = (tableName: string) => {
  return masterportalByTableNameMap[tableName] ?? null
}

export const isNumericTopicDocFormat = (
  format: TopicDocCompiledAttribute['type'],
): format is TopicDocNumericFormat => {
  return topicDocNumericFormatSet.has(format)
}

export const getInspectorAttributeFormat = (sourceId: string, tagKey: string) => {
  const sourceFormats = sourceAttributeFormats.get(sourceId)
  if (!sourceFormats) return null

  for (const candidate of getInspectorTagKeyCandidates(tagKey)) {
    const match = sourceFormats.get(candidate)
    if (match) return match
  }
  return null
}

export const getTopicDocFormatsForTagKey = (tagKey: string) => {
  for (const candidate of getInspectorTagKeyCandidates(tagKey)) {
    const match = keyAttributeFormats.get(candidate)
    if (match) return match
  }
  return undefined
}

export const getInspectorAttributePurpose = (sourceId: string, tagKey: string) => {
  const sourcePurposes = sourceAttributePurposes.get(sourceId)
  if (!sourcePurposes) return null

  for (const candidate of getInspectorTagKeyCandidates(tagKey)) {
    const match = sourcePurposes.get(candidate)
    if (match) return match
  }
  return null
}

export const getDescriptionForInspectorTag = (
  sourceId: string,
  tagKey: string,
  tagValue: string | undefined,
) => {
  const sourceDescriptions = inspectorDescriptionMap[sourceId]
  if (!sourceDescriptions) return undefined
  if (tagValue) {
    const fromValue = sourceDescriptions.values[tagKey]?.[tagValue]
    if (fromValue) return fromValue
  }
  return sourceDescriptions.keys[tagKey]
}
