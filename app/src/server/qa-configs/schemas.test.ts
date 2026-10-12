import { describe, expect, test } from 'vitest'
import { CreateQaConfigFormSchema, qaIndicatorsToDrafts } from './schemas'

const totalDraft = {
  key: 'total',
  label: 'Stellplätze',
  goodThreshold: '10',
  needsReviewThreshold: '20',
  absoluteDifferenceThreshold: '4',
}

const totalIndicator = {
  key: 'total',
  label: 'Stellplätze',
  goodThreshold: 0.1,
  needsReviewThreshold: 0.2,
  absoluteDifferenceThreshold: 4,
}

const formValues = {
  slug: 'test',
  label: 'Test',
  isActive: 'true',
  mapTable: 'public.qa_test',
  mapAttribution: '',
  dataset: 'parking_euvm',
  areaTable: 'data.euvm_qa_voronoi_2026',
  areaFilter: 'all',
  referenceTable: 'data.qa_parkings_euvm_reference_2026',
  indicators: [totalDraft],
  regionId: '1',
  trustedOsmUsernames: '',
  referenceFrozenAt: '2026-09-01',
} as const

describe('QA config form schemas', () => {
  test('decodes indicator drafts, storing the percent thresholds as fractions', () => {
    const parsed = CreateQaConfigFormSchema.parse(formValues)
    expect(parsed.indicators).toEqual([totalIndicator])
    expect(parsed.dataset).toBe('parking_euvm')
  })

  test('normalizes the trusted usernames and reads the freeze day as 00:00 UTC', () => {
    const parsed = CreateQaConfigFormSchema.parse({
      ...formValues,
      trustedOsmUsernames: ' Alice \n\nBOB',
    })
    expect(parsed.trustedOsmUsernames).toEqual(['alice', 'bob'])
    expect(parsed.referenceFrozenAt).toEqual(new Date('2026-09-01T00:00:00Z'))
  })

  test('stored indicators encode back into the drafts', () => {
    expect(qaIndicatorsToDrafts([totalIndicator])).toEqual([totalDraft])
  })

  test('rejects empty thresholds, percent over 100 and "Gut" above "Überprüfung"', () => {
    const withDraft = (patch: Partial<typeof totalDraft>) =>
      CreateQaConfigFormSchema.safeParse({
        ...formValues,
        indicators: [{ ...totalDraft, ...patch }],
      })
    expect(withDraft({ absoluteDifferenceThreshold: '' }).success).toBe(false)
    expect(withDraft({ needsReviewThreshold: '120' }).success).toBe(false)
    expect(withDraft({ goodThreshold: '30', needsReviewThreshold: '20' }).success).toBe(false)
  })

  test('rejects tables outside "data." / "public."', () => {
    expect(
      CreateQaConfigFormSchema.safeParse({ ...formValues, referenceTable: 'public.x' }).success,
    ).toBe(false)
    expect(CreateQaConfigFormSchema.safeParse({ ...formValues, mapTable: 'qa_test' }).success).toBe(
      false,
    )
  })
})
