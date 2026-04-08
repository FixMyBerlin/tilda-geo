import type { CompiledAttribute, CompiledValue, InspectorDescriptions } from './types'

const upsertInspectorDescription = (
  descriptions: InspectorDescriptions,
  sourceId: string,
  key: string,
  value: string | undefined,
  description: string,
) => {
  if (!descriptions[sourceId]) {
    descriptions[sourceId] = { keys: {}, values: {} }
  }
  if (value === undefined) {
    descriptions[sourceId].keys[key] = description
    return
  }
  if (!descriptions[sourceId].values[key]) {
    descriptions[sourceId].values[key] = {}
  }
  descriptions[sourceId].values[key][value] = description
}

export const addInspectorTranslationsForSource = (input: {
  sourceId: string
  title: string
  compiledAttributes: Array<CompiledAttribute>
  map: Record<string, string>
  descriptions: InspectorDescriptions
}) => {
  input.map[`${input.sourceId}--title`] = input.title

  for (const attribute of input.compiledAttributes) {
    if (attribute.type === 'ignore') {
      continue
    }

    input.map[`${input.sourceId}--${attribute.key}--key`] = attribute.label
    if (attribute.description) {
      upsertInspectorDescription(
        input.descriptions,
        input.sourceId,
        attribute.key,
        undefined,
        attribute.description,
      )
    }

    if (attribute.values?.length) {
      addValueTranslations({
        sourceId: input.sourceId,
        key: attribute.key,
        values: attribute.values,
        map: input.map,
        descriptions: input.descriptions,
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
}) => {
  for (const valueNode of input.values) {
    input.map[`${input.sourceId}--${input.key}=${valueNode.value}`] = valueNode.label
    if (valueNode.description) {
      upsertInspectorDescription(
        input.descriptions,
        input.sourceId,
        input.key,
        valueNode.value,
        valueNode.description,
      )
      input.map[`${input.sourceId}--${input.key}=${valueNode.value}--description`] =
        valueNode.description
    }
    if (valueNode.children?.length) {
      addValueTranslations({
        ...input,
        values: valueNode.children,
      })
    }
  }
}
