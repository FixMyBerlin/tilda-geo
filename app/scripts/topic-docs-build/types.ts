export type CompiledValue = {
  value: string
  label: string
  description?: string
  chapterRefs?: Array<string>
  children?: Array<CompiledValue>
}

export type CompiledAttribute = {
  key: string
  type: 'string' | 'number' | 'sanitized_strings' | 'ignore'
  label: string
  description?: string
  chapterRefs?: Array<string>
  values?: Array<CompiledValue>
}

export type CompiledChapter = {
  id: string
  title: string
  markdown: string
}

export type CompiledTopicDoc = {
  topic: string
  tableName: string
  sourceIds: Array<string>
  title: string
  summary?: string
  groups?: Array<{ id: string; label?: string }>
  attributes: Array<CompiledAttribute>
  chapters: Array<CompiledChapter>
}

export type InspectorDescriptions = Record<
  string,
  {
    keys: Record<string, string>
    values: Record<string, Record<string, string>>
  }
>
