import { describe, expect, test } from 'vitest'
import { CreateQaConfigFormSchema, UpdateQaConfigFormSchema } from './schemas'

const formValues = {
  slug: 'test',
  label: 'Test',
  isActive: 'true',
  mapTable: 'qa_test',
  mapAttribution: '',
  goodThreshold: '10',
  needsReviewThreshold: '20',
  absoluteDifferenceThreshold: '4',
  regionId: '1',
  trustedOsmUsernames: '',
  referenceFrozenAt: '2026-09-01',
} as const

describe('QA config form schemas', () => {
  test('convert percent thresholds to stored fractions once', () => {
    const parsed = CreateQaConfigFormSchema.parse(formValues)
    expect(parsed.goodThreshold).toBe(0.1)
    expect(parsed.needsReviewThreshold).toBe(0.2)
  })

  test('update schema converts the same way', () => {
    const parsed = UpdateQaConfigFormSchema.parse({ ...formValues, id: 1 })
    expect(parsed.goodThreshold).toBe(0.1)
    expect(parsed.needsReviewThreshold).toBe(0.2)
  })

  test('rejects "Gut" above "Überprüfung"', () => {
    const result = CreateQaConfigFormSchema.safeParse({ ...formValues, goodThreshold: '30' })
    expect(result.success).toBe(false)
  })

  test('rejects a negative absolute difference threshold', () => {
    const result = CreateQaConfigFormSchema.safeParse({
      ...formValues,
      absoluteDifferenceThreshold: '-1',
    })
    expect(result.success).toBe(false)
  })
})
