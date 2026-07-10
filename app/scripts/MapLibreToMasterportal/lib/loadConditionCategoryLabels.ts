import masterportalByTableName from '../../../src/data/generated/topicDocs/masterportalByTableName.gen'

const conditionCategoryAttribute =
  masterportalByTableName.parkings?.gfiAttributes.condition_category

if (
  !conditionCategoryAttribute ||
  typeof conditionCategoryAttribute === 'string' ||
  !('format' in conditionCategoryAttribute)
) {
  throw new Error('parkings.condition_category format not found in masterportalByTableName.gen.ts')
}

export const conditionCategoryLabels = conditionCategoryAttribute.format

export const loadConditionCategoryLabels = () => ({ ...conditionCategoryLabels })

export const validateLegendLabels = (cascadeTokens: string[]) => {
  const labels = loadConditionCategoryLabels()
  const warnings: string[] = []
  const errors: string[] = []
  const legendValues = new Set<string>()

  for (const token of cascadeTokens) {
    const label = labels[token as keyof typeof labels]
    if (!label) {
      errors.push(
        `Cascade token "${token}" has no label in topic-docs (parkings.condition_category)`,
      )
      continue
    }
    if (legendValues.has(label)) {
      errors.push(`Duplicate legendValue "${label}" for cascade token "${token}"`)
    }
    legendValues.add(label)
  }

  for (const token of Object.keys(labels)) {
    if (!cascadeTokens.includes(token)) {
      warnings.push(
        `Topic-docs token "${token}" (${labels[token as keyof typeof labels]}) is not in the Mapbox color cascade`,
      )
    }
  }

  return { warnings, errors }
}
