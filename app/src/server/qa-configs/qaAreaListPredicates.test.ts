import { describe, expect, test } from 'vitest'
import {
  QA_STATUS_OPTIONS,
  type QaStatusParam,
} from '@/components/regionen/pageRegionSlug/modes/qa/qaConfigStyles'
import { qaStatusSqlPredicate } from './qaAreaListPredicates'

describe('qaStatusSqlPredicate', () => {
  test('all and undefined emit TRUE with no params', () => {
    expect(qaStatusSqlPredicate('all', 2)).toEqual({ sql: 'TRUE', params: [] })
    expect(qaStatusSqlPredicate(undefined, 2)).toEqual({ sql: 'TRUE', params: [] })
  })

  test.each(QA_STATUS_OPTIONS)('$key matches option table enums', (option) => {
    const result = qaStatusSqlPredicate(option.key, 2)
    const expectedParams: string[] = []
    const clauses: string[] = []
    let index = 2
    if (option.userStatus === null) {
      clauses.push('l."userStatus" IS NULL')
    } else {
      clauses.push(`l."userStatus"::text = $${index}`)
      expectedParams.push(option.userStatus)
      index += 1
    }
    if (option.systemStatus !== null) {
      clauses.push(`l."systemStatus"::text = $${index}`)
      expectedParams.push(option.systemStatus)
    }
    expect(result).toEqual({ sql: clauses.join(' AND '), params: expectedParams })
  })

  // The schema rejects unknown keys, so this only fires if the option table and enum drift apart.
  test('throws instead of dropping the filter on an unknown key', () => {
    expect(() => qaStatusSqlPredicate('actionable' as QaStatusParam, 2)).toThrow(
      'Unknown QA status key: actionable',
    )
  })
})
