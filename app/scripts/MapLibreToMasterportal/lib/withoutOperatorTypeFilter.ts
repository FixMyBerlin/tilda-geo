import type { MasterportalRule } from './types'

/** GPKG exports pre-filter by operator_type — drop redundant style rule conditions. */
export const withoutOperatorTypeFilter = (rules: MasterportalRule[]) =>
  rules.map((rule) => {
    const properties = rule.conditions?.properties
    if (!properties) return rule

    const rest = Object.fromEntries(
      Object.entries(properties).filter(([key]) => key !== 'operator_type'),
    )

    if (Object.keys(rest).length === 0) {
      return { style: rule.style }
    }

    return {
      ...rule,
      conditions: { properties: rest },
    }
  })
