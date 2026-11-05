import topicDocsByTableName from '@/data/generated/topicDocs/byTableName.gen'
import masterportalByTableName from '@/data/generated/topicDocs/masterportalByTableName.gen'
import { getInspectorTagKeyCandidates } from '@/data/topicDocs/inspector'
import type { TopicDocMasterportalGfiConfig } from '@/data/topicDocs/masterportalGfi.types'
import type { TopicDocAttributeFormat } from '@/data/topicDocs/schema'
import type { TopicDocAttributePurpose } from '@/data/topicDocs/schema'

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

const topicDocsByTableNameMap: Partial<Record<string, TopicDocCompiled>> = topicDocsByTableName
const masterportalByTableNameMap: Partial<Record<string, TopicDocMasterportalGfiConfig>> =
  masterportalByTableName
const keyAttributeFormats = new Map<string, Set<TopicDocCompiledAttribute['type']>>()

for (const doc of Object.values(topicDocsByTableNameMap)) {
  if (!doc) continue
  for (const attribute of doc.attributes) {
    const knownFormats = keyAttributeFormats.get(attribute.key) ?? new Set()
    knownFormats.add(attribute.type)
    keyAttributeFormats.set(attribute.key, knownFormats)
  }
}

export const getTopicDocByTableName = (tableName: string) => {
  return topicDocsByTableNameMap[tableName] ?? null
}

export const getMasterportalByTableName = (tableName: string) => {
  return masterportalByTableNameMap[tableName] ?? null
}

export const getTopicDocFormatsForTagKey = (tagKey: string) => {
  for (const candidate of getInspectorTagKeyCandidates(tagKey)) {
    const match = keyAttributeFormats.get(candidate)
    if (match) return match
  }
  return undefined
}
