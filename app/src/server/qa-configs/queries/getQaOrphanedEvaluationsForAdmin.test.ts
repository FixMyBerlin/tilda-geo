import { describe, expect, test } from 'vitest'
import { buildQaOrphanedEvaluationsSql } from './getQaOrphanedEvaluationsForAdmin.server'

describe('buildQaOrphanedEvaluationsSql', () => {
  test('pages with LIMIT and OFFSET placeholders', () => {
    const sql = buildQaOrphanedEvaluationsSql('public."bikelane_qa"')
    expect(sql).toMatch(/LIMIT \$2\s+OFFSET \$3/)
    expect(sql).toContain('public."bikelane_qa"')
  })
})
