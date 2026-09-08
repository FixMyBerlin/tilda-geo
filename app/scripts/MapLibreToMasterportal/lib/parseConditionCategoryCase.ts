import type { ConditionCategoryRule } from './types'

const primaryToken = (condition: unknown) => {
  if (
    Array.isArray(condition) &&
    condition[0] === '==' &&
    Array.isArray(condition[1]) &&
    condition[1][0] === 'get' &&
    typeof condition[2] === 'string'
  ) {
    return condition[2]
  }
  return undefined
}

/** Parse `['case', ['==', ['get', 'condition_category_primary'], token], color, ..., fallback]`. */
export const parseConditionCategoryCase = (expression: unknown) => {
  if (!Array.isArray(expression) || expression[0] !== 'case') {
    throw new Error('Expected Mapbox case expression')
  }

  const rules: ConditionCategoryRule[] = []
  let fallback = '#4B5563'

  for (let i = 1; i < expression.length; i += 2) {
    const condition = expression[i]
    const color = expression[i + 1]
    if (typeof color !== 'string') continue

    const token = primaryToken(condition)
    if (token === undefined) {
      fallback = color
      break
    }
    rules.push({ token, color })
  }

  return { rules, fallback } satisfies { rules: ConditionCategoryRule[]; fallback: string }
}
