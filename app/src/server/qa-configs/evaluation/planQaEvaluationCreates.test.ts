import { describe, expect, test } from 'vitest'
import {
  planQaEvaluationCreates,
  type QaAreaRow,
  type QaEvaluationConfig,
  type QaPreviousEvaluation,
} from './planQaEvaluationCreates'
import type { QaLastEditor } from './qaEvaluationRules'

// No trusted usernames, so these tests cover the plain threshold rules.
const config: QaEvaluationConfig = {
  goodThreshold: 0.1,
  needsReviewThreshold: 0.2,
  absoluteDifferenceThreshold: 4,
  trustedOsmUsernames: [],
  referenceFrozenAt: new Date('2026-01-01T00:00:00Z'),
}

function getArea(
  id: string,
  relative: number | null,
  previousRelative: number | null,
  absoluteDifference: number | null,
  lastEditors: QaLastEditor[],
) {
  return {
    id,
    relative,
    previous_relative: previousRelative,
    count_reference: 100,
    count_current: 100,
    absoluteDifference,
    last_editors: lastEditors,
  } satisfies QaAreaRow
}

function plan(
  areas: QaAreaRow[],
  previous: Record<string, QaPreviousEvaluation> = {},
  configOverrides: Partial<QaEvaluationConfig> = {},
) {
  return planQaEvaluationCreates({
    configId: 1,
    config: { ...config, ...configOverrides },
    areas,
    previousByAreaId: new Map(Object.entries(previous)),
  })
}

describe('planQaEvaluationCreates()', () => {
  test('creates an evaluation for every area on first run', () => {
    const result = plan([getArea('a', 1, 1, 0, []), getArea('b', 1.5, 1.5, 50, [])])

    expect(result.map(({ areaId, systemStatus }) => ({ areaId, systemStatus }))).toEqual([
      { areaId: 'a', systemStatus: 'GOOD' },
      { areaId: 'b', systemStatus: 'PROBLEMATIC' },
    ])
    expect(result[0]).toMatchObject({
      configId: 1,
      evaluatorType: 'SYSTEM',
      userStatus: null,
      body: null,
      userId: null,
      decisionData: { relative: 1, absoluteChange: 0, goodThreshold: 0.1 },
    })
  })

  test('skips areas whose status did not change', () => {
    const result = plan([getArea('a', 1, 1, 0, [])], {
      a: { systemStatus: 'GOOD', userStatus: null },
    })

    expect(result).toEqual([])
  })

  test('skips areas whose relative changed but status stayed the same', () => {
    const result = plan([getArea('a', 1.5, 1.6, 50, [])], {
      a: { systemStatus: 'PROBLEMATIC', userStatus: null },
    })

    expect(result).toEqual([])
  })

  test('creates an evaluation when the system status changed', () => {
    const result = plan([getArea('a', 1.5, 1, 50, []), getArea('b', 1, 1, 0, [])], {
      a: { systemStatus: 'GOOD', userStatus: null },
      b: { systemStatus: 'GOOD', userStatus: null },
    })

    expect(result.map(({ areaId, systemStatus }) => ({ areaId, systemStatus }))).toEqual([
      { areaId: 'a', systemStatus: 'PROBLEMATIC' },
    ])
  })

  test('resets a NOT_OK user decision when the system becomes GOOD', () => {
    const result = plan([getArea('a', 1, 0.6, 0, [])], {
      a: { systemStatus: 'PROBLEMATIC', userStatus: 'NOT_OK_DATA_ERROR' },
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ areaId: 'a', systemStatus: 'GOOD', userStatus: null })
  })

  test('never creates over an OK_STRUCTURAL_CHANGE user decision', () => {
    const result = plan([getArea('a', 1, 0.4, 0, []), getArea('b', 1.5, 1, 50, [])], {
      a: { systemStatus: 'PROBLEMATIC', userStatus: 'OK_STRUCTURAL_CHANGE' },
      b: { systemStatus: 'GOOD', userStatus: 'OK_STRUCTURAL_CHANGE' },
    })

    expect(result).toEqual([])
  })
})

describe('planQaEvaluationCreates() — TRUSTED_EDITOR_CHANGE', () => {
  const referenceFrozenAt = new Date('2026-01-01T00:00:00Z')
  const afterCutoff = Math.floor(referenceFrozenAt.getTime() / 1000) + 3600
  const beforeCutoff = Math.floor(referenceFrozenAt.getTime() / 1000) - 3600
  const exactCutoff = Math.floor(referenceFrozenAt.getTime() / 1000)

  const trustedConfig: Partial<QaEvaluationConfig> = {
    trustedOsmUsernames: ['alice', 'bob'],
    referenceFrozenAt,
  }

  test('a trusted editor covering a PROBLEMATIC cell creates a TRUSTED_EDITOR_CHANGE row naming them', () => {
    // relative 1.5 with absoluteDifference 50 (> threshold 4) => percent status PROBLEMATIC.
    const area = getArea('a', 1.5, 1.5, 50, [
      { osmUser: 'Alice', spaceCount: 50, updatedAt: afterCutoff },
    ])

    const result = plan([area], {}, trustedConfig)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      areaId: 'a',
      systemStatus: 'TRUSTED_EDITOR_CHANGE',
      userStatus: null,
      decisionData: { relative: 1.5, absoluteChange: 50 },
    })
    expect(result[0]?.body).toContain('Alice')
    expect(result[0]?.body).not.toContain('Bob')
  })

  test('untrusted space count exactly at the threshold still passes', () => {
    const area = getArea('a', 1.5, 1.5, 50, [
      { osmUser: 'Alice', spaceCount: 46, updatedAt: afterCutoff },
      { osmUser: 'Carol', spaceCount: 4, updatedAt: afterCutoff },
    ])

    const result = plan([area], {}, trustedConfig)

    expect(result[0]).toMatchObject({ systemStatus: 'TRUSTED_EDITOR_CHANGE' })
    expect(result[0]?.body).toContain('4 Stellplätze')
  })

  test('untrusted space count above the threshold falls through to a plain PROBLEMATIC row', () => {
    const area = getArea('a', 1.5, 1.5, 50, [
      { osmUser: 'Alice', spaceCount: 45, updatedAt: afterCutoff },
      { osmUser: 'Carol', spaceCount: 5, updatedAt: afterCutoff },
    ])

    const result = plan([area], {}, trustedConfig)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ systemStatus: 'PROBLEMATIC', userStatus: null, body: null })
  })

  test('null osmUser never counts as trusted, even for an anonymized extract', () => {
    const area = getArea('a', 1.5, 1.5, 50, [
      { osmUser: null, spaceCount: 50, updatedAt: afterCutoff },
    ])

    const result = plan([area], {}, trustedConfig)

    expect(result[0]).toMatchObject({ systemStatus: 'PROBLEMATIC', userStatus: null, body: null })
  })

  test('edits before the freeze day are ignored, not counted trusted or untrusted', () => {
    const area = getArea('a', 1.5, 1.5, 50, [
      { osmUser: 'Alice', spaceCount: 50, updatedAt: beforeCutoff },
    ])

    const result = plan([area], {}, trustedConfig)

    expect(result[0]).toMatchObject({ systemStatus: 'PROBLEMATIC', userStatus: null, body: null })
  })

  test('an edit exactly at 00:00 UTC of the freeze day counts', () => {
    const area = getArea('a', 1.5, 1.5, 50, [
      { osmUser: 'Alice', spaceCount: 0, updatedAt: exactCutoff },
    ])

    const result = plan([area], {}, trustedConfig)

    expect(result[0]).toMatchObject({ systemStatus: 'TRUSTED_EDITOR_CHANGE' })
  })

  test('matches trusted usernames case-insensitively against the normalized config list', () => {
    const area = getArea('a', 1.5, 1.5, 50, [
      { osmUser: 'Alice', spaceCount: 0, updatedAt: afterCutoff },
    ])

    const result = plan([area], {}, trustedConfig)

    expect(result[0]).toMatchObject({ systemStatus: 'TRUSTED_EDITOR_CHANGE' })
    expect(result[0]?.body).toContain('Alice')
  })

  test('a plain SYSTEM PROBLEMATIC previous row becomes TRUSTED_EDITOR_CHANGE (first night after enabling)', () => {
    const area = getArea('a', 1.5, 1.5, 50, [
      { osmUser: 'Alice', spaceCount: 50, updatedAt: afterCutoff },
    ])

    const result = plan(
      [area],
      { a: { systemStatus: 'PROBLEMATIC', userStatus: null } },
      trustedConfig,
    )

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ systemStatus: 'TRUSTED_EDITOR_CHANGE', userStatus: null })
  })

  test('a TRUSTED_EDITOR_CHANGE previous row that still passes creates nothing', () => {
    const area = getArea('a', 1.5, 1.5, 50, [
      { osmUser: 'Alice', spaceCount: 50, updatedAt: afterCutoff },
    ])

    const result = plan(
      [area],
      { a: { systemStatus: 'TRUSTED_EDITOR_CHANGE', userStatus: null } },
      trustedConfig,
    )

    expect(result).toEqual([])
  })

  test('a TRUSTED_EDITOR_CHANGE previous row falls back to PROBLEMATIC once untrusted edits appear', () => {
    const area = getArea('a', 1.5, 1.5, 50, [
      { osmUser: 'Carol', spaceCount: 50, updatedAt: afterCutoff },
    ])

    const result = plan(
      [area],
      { a: { systemStatus: 'TRUSTED_EDITOR_CHANGE', userStatus: null } },
      trustedConfig,
    )

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ systemStatus: 'PROBLEMATIC', userStatus: null, body: null })
  })

  test('a human NOT_OK_DATA_ERROR decision is never overridden, even while trusted editors pass', () => {
    const area = getArea('a', 1.5, 1.5, 50, [
      { osmUser: 'Alice', spaceCount: 50, updatedAt: afterCutoff },
    ])

    const result = plan(
      [area],
      { a: { systemStatus: 'PROBLEMATIC', userStatus: 'NOT_OK_DATA_ERROR' } },
      trustedConfig,
    )

    expect(result).toEqual([])
  })

  test('a human OK_STRUCTURAL_CHANGE decision is never overridden, even while trusted editors pass', () => {
    const area = getArea('a', 1.5, 1.5, 50, [
      { osmUser: 'Alice', spaceCount: 50, updatedAt: afterCutoff },
    ])

    const result = plan(
      [area],
      { a: { systemStatus: 'PROBLEMATIC', userStatus: 'OK_STRUCTURAL_CHANGE' } },
      trustedConfig,
    )

    expect(result).toEqual([])
  })

  test('absolute difference within threshold is GOOD regardless of editors', () => {
    const area = getArea('a', 1.5, 1.5, 2, [
      { osmUser: 'Carol', spaceCount: 999, updatedAt: afterCutoff },
    ])

    const result = plan([area], {}, trustedConfig)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ systemStatus: 'GOOD', userStatus: null, body: null })
  })
})
