import type { CompiledAttribute, CompiledValue, InspectorDescriptions } from './types'

// Some map sources show features from several tables, so several YAMLs list the same `sourceIds`
// entry. Their per-table titles differ, but the inspector shows one title per source.
const sharedSourceTitles: Record<string, string> = {
  tilda_parkings: 'Straßenparken',
  atlas_barriers: 'Barrieren',
}

// YAMLs sharing a source must agree on every text, otherwise the result depends on file order.
const setOnce = (record: Record<string, string>, key: string, text: string, filePath: string) => {
  const existing = record[key]
  if (existing !== undefined && existing !== text) {
    throw new Error(
      `Conflicting topic docs text for "${key}" in ${filePath}: "${existing}" vs. "${text}". ` +
        'YAMLs sharing a source must use the same text (titles: add the source to sharedSourceTitles).',
    )
  }
  record[key] = text
}

const upsertInspectorDescription = (
  descriptions: InspectorDescriptions,
  sourceId: string,
  key: string,
  value: string | undefined,
  description: string,
  filePath: string,
) => {
  if (!descriptions[sourceId]) {
    descriptions[sourceId] = { keys: {}, values: {} }
  }
  if (value === undefined) {
    setOnce(descriptions[sourceId].keys, key, description, filePath)
    return
  }
  if (!descriptions[sourceId].values[key]) {
    descriptions[sourceId].values[key] = {}
  }
  setOnce(descriptions[sourceId].values[key], value, description, filePath)
}

export const addInspectorTranslationsForSource = (input: {
  sourceId: string
  title: string
  compiledAttributes: Array<CompiledAttribute>
  map: Record<string, string>
  descriptions: InspectorDescriptions
  filePath: string
}) => {
  const title = sharedSourceTitles[input.sourceId] ?? input.title
  setOnce(input.map, `${input.sourceId}--title`, title, input.filePath)

  for (const attribute of input.compiledAttributes) {
    if (attribute.type === 'ignore') {
      continue
    }

    setOnce(input.map, `${input.sourceId}--${attribute.key}--key`, attribute.label, input.filePath)
    if (attribute.description) {
      upsertInspectorDescription(
        input.descriptions,
        input.sourceId,
        attribute.key,
        undefined,
        attribute.description,
        input.filePath,
      )
    }

    if (attribute.values?.length) {
      addValueTranslations({
        sourceId: input.sourceId,
        key: attribute.key,
        values: attribute.values,
        map: input.map,
        descriptions: input.descriptions,
        filePath: input.filePath,
      })
    }
  }
}

const addValueTranslations = (input: {
  sourceId: string
  key: string
  values: Array<CompiledValue>
  map: Record<string, string>
  descriptions: InspectorDescriptions
  filePath: string
}) => {
  for (const valueNode of input.values) {
    setOnce(
      input.map,
      `${input.sourceId}--${input.key}=${valueNode.value}`,
      valueNode.label,
      input.filePath,
    )
    if (valueNode.description) {
      upsertInspectorDescription(
        input.descriptions,
        input.sourceId,
        input.key,
        valueNode.value,
        valueNode.description,
        input.filePath,
      )
      setOnce(
        input.map,
        `${input.sourceId}--${input.key}=${valueNode.value}--description`,
        valueNode.description,
        input.filePath,
      )
    }
  }
}
