import type { KeyDocEntry, TopicDocsYaml, ValueDocNode } from '../../src/data/topicDocs/schema'
import type { CompiledAttribute, CompiledValue } from './types'

const resolveDescription = (value: string | undefined) => value

const compileValueNode = (node: ValueDocNode): CompiledValue => ({
  value: node.value,
  label: node.label,
  description: resolveDescription(node.description),
  chapterRefs: node.chapterRefs?.map((chapter) => chapter.chapterId),
  children: node.children?.map((child) => compileValueNode(child)),
})

const mergeValueNodes = (
  base: Array<ValueDocNode> | undefined,
  add: Array<ValueDocNode> | undefined,
) => {
  const merged: Array<ValueDocNode> = []
  const seen = new Set<string>()
  for (const node of [...(base ?? []), ...(add ?? [])]) {
    if (seen.has(node.value)) continue
    seen.add(node.value)
    merged.push(node)
  }
  return merged
}

const parseTableAttributePointer = (pointer: string, label: string, context: string) => {
  const [targetTableNameRaw, targetAttributeKeyRaw] = pointer.split('.', 2)
  const targetTableName = targetTableNameRaw?.trim()
  const targetAttributeKey = targetAttributeKeyRaw?.trim()
  if (!targetTableName || !targetAttributeKey) {
    throw new Error(
      `Invalid ${label} "${pointer}" (${context}). Expected format "<tableName>.<attributeKey>"`,
    )
  }
  return { targetTableName, targetAttributeKey }
}

const resolveValuesRef = (input: {
  valuesRef: string
  currentTableName: string
  docsByTableName: Map<string, TopicDocsYaml>
}) => {
  const { targetTableName, targetAttributeKey } = parseTableAttributePointer(
    input.valuesRef,
    'valuesRef',
    input.currentTableName,
  )

  const targetDoc = input.docsByTableName.get(targetTableName)
  if (!targetDoc) {
    throw new Error(
      `Unknown table "${targetTableName}" in valuesRef "${input.valuesRef}" (table "${input.currentTableName}")`,
    )
  }

  const targetAttribute = targetDoc.attributes.find(
    (attribute) => attribute.key === targetAttributeKey,
  )
  if (!targetAttribute) {
    throw new Error(
      `Unknown attribute "${targetAttributeKey}" in valuesRef "${input.valuesRef}" (table "${input.currentTableName}")`,
    )
  }
  if (!targetAttribute.values?.length) {
    throw new Error(
      `Referenced attribute "${input.valuesRef}" has no values to reuse (table "${input.currentTableName}")`,
    )
  }

  return targetAttribute.values
}

const followRefToTerminalEntry = (input: {
  pointer: string
  docsByTableName: Map<string, TopicDocsYaml>
  visiting: Set<string>
  errorContext: string
}): { tableName: string; entry: KeyDocEntry } => {
  const { targetTableName, targetAttributeKey } = parseTableAttributePointer(
    input.pointer,
    'ref',
    input.errorContext,
  )
  const visitToken = `${targetTableName}.${targetAttributeKey}`
  if (input.visiting.has(visitToken)) {
    throw new Error(`Circular attribute ref at "${visitToken}" (${input.errorContext})`)
  }
  input.visiting.add(visitToken)

  const targetDoc = input.docsByTableName.get(targetTableName)
  if (!targetDoc) {
    throw new Error(
      `Unknown table "${targetTableName}" in ref "${input.pointer}" (${input.errorContext})`,
    )
  }

  const targetAttribute = targetDoc.attributes.find(
    (attribute) => attribute.key === targetAttributeKey,
  )
  if (!targetAttribute) {
    throw new Error(
      `Unknown attribute "${targetAttributeKey}" in ref "${input.pointer}" (${input.errorContext})`,
    )
  }

  if (targetAttribute.ref) {
    const inner = followRefToTerminalEntry({
      pointer: targetAttribute.ref,
      docsByTableName: input.docsByTableName,
      visiting: input.visiting,
      errorContext: input.errorContext,
    })
    input.visiting.delete(visitToken)
    return inner
  }

  input.visiting.delete(visitToken)
  return { tableName: targetTableName, entry: targetAttribute }
}

const resolveValueDocNodesForEntry = (input: {
  attribute: KeyDocEntry
  owningTableName: string
  docsByTableName: Map<string, TopicDocsYaml>
  errorContext: string
  valueVisit: Set<string>
}): Array<ValueDocNode> | undefined => {
  const visitToken = `${input.owningTableName}.${input.attribute.key}`
  if (input.valueVisit.has(visitToken)) {
    throw new Error(`Circular values resolution at "${visitToken}" (${input.errorContext})`)
  }
  input.valueVisit.add(visitToken)

  try {
    if (input.attribute.values?.length) {
      return mergeValueNodes(input.attribute.values, input.attribute.valuesAdd)
    }
    if (input.attribute.valuesRef) {
      const fromRef = resolveValuesRef({
        valuesRef: input.attribute.valuesRef,
        currentTableName: input.owningTableName,
        docsByTableName: input.docsByTableName,
      })
      return mergeValueNodes(fromRef, input.attribute.valuesAdd)
    }
    return mergeValueNodes(undefined, input.attribute.valuesAdd)
  } finally {
    input.valueVisit.delete(visitToken)
  }
}

export const compileAttributesForDoc = (input: {
  doc: TopicDocsYaml
  tableName: string
  docsByTableName: Map<string, TopicDocsYaml>
}) => {
  const { doc, tableName, docsByTableName } = input
  return doc.attributes.map((attribute) => {
    const errorContext = `table "${tableName}" attribute "${attribute.key}"`

    if (attribute.ref) {
      const { tableName: refTableName, entry: refEntry } = followRefToTerminalEntry({
        pointer: attribute.ref,
        docsByTableName,
        visiting: new Set(),
        errorContext,
      })
      const label = refEntry.label ?? (refEntry.format === 'ignore' ? attribute.key : undefined)
      if (!label) {
        throw new Error(
          `Referenced attribute "${attribute.ref}" resolves to an entry without label (${errorContext})`,
        )
      }
      const baseValues = resolveValueDocNodesForEntry({
        attribute: refEntry,
        owningTableName: refTableName,
        docsByTableName,
        errorContext: `${errorContext} via ref "${attribute.ref}"`,
        valueVisit: new Set(),
      })
      const resolvedValues = mergeValueNodes(baseValues, attribute.valuesAdd)
      return {
        key: attribute.key,
        type: refEntry.format,
        label,
        description: resolveDescription(refEntry.description),
        chapterRefs: refEntry.chapterRefs?.map((chapter) => chapter.chapterId),
        values: resolvedValues.map((valueNode) => compileValueNode(valueNode)),
      } satisfies CompiledAttribute
    }

    const valuesFromRef = attribute.valuesRef
      ? resolveValuesRef({
          valuesRef: attribute.valuesRef,
          currentTableName: tableName,
          docsByTableName,
        })
      : undefined
    const resolvedValues = attribute.values
      ? attribute.values
      : mergeValueNodes(valuesFromRef, attribute.valuesAdd)

    const label = attribute.label ?? (attribute.format === 'ignore' ? attribute.key : undefined)
    if (!label) {
      throw new Error(`Missing label for attribute "${attribute.key}" in table "${tableName}"`)
    }

    return {
      key: attribute.key,
      type: attribute.format,
      label,
      description: resolveDescription(attribute.description),
      chapterRefs: attribute.chapterRefs?.map((chapter) => chapter.chapterId),
      values: resolvedValues?.map((valueNode) => compileValueNode(valueNode)),
    } satisfies CompiledAttribute
  })
}
