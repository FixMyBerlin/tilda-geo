import type { ConditionCategoryRule } from './types'

const isIndexOfCondition = (
  value: unknown,
): value is ['>=', ['index-of', string, ['get', string]], number] => {
  return (
    Array.isArray(value) &&
    value[0] === '>=' &&
    Array.isArray(value[1]) &&
    value[1][0] === 'index-of' &&
    typeof value[1][1] === 'string' &&
    value[2] === 0
  )
}

/** Parse Mapbox `['case', cond, color, cond, color, ..., fallback]` with index-of on condition_category. */
export const parseConditionCategoryCase = (expression: unknown) => {
  if (!Array.isArray(expression) || expression[0] !== 'case') {
    throw new Error('Expected Mapbox case expression')
  }

  const rules: ConditionCategoryRule[] = []
  let fallback = '#4B5563'

  for (let i = 1; i < expression.length; i += 2) {
    const condition = expression[i]
    const color = expression[i + 1]

    if (typeof color !== 'string') {
      continue
    }

    if (i + 1 === expression.length - 1 && !isIndexOfCondition(condition)) {
      fallback = color
      break
    }

    if (!isIndexOfCondition(condition)) {
      continue
    }

    const token = condition[1][1]
    rules.push({ token, color })
  }

  return { rules, fallback } satisfies { rules: ConditionCategoryRule[]; fallback: string }
}
