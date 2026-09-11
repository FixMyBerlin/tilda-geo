import { describe, expect, test } from 'vitest'
import {
  planQaEvaluationCreates,
  type QaAreaRow,
  type QaPreviousEvaluation,
} from './planQaEvaluationCreates'

const config = { goodThreshold: 0.1, needsReviewThreshold: 0.2, absoluteDifferenceThreshold: 4 }

function getArea(
  id: string,
  relative: number | null,
  previousRelative: number | null,
  absoluteDifference: number | null,
) {
  return {
    id,
    relative,
    previous_relative: previousRelative,
    count_reference: 100,
    count_current: 100,
    absoluteDifference,
  } satisfies QaAreaRow
}

function plan(areas: QaAreaRow[], previous: Record<string, QaPreviousEvaluation> = {}) {
  return planQaEvaluationCreates({
    configId: 1,
    config,
    areas,
    previousByAreaId: new Map(Object.entries(previous)),
  })
}

describe('planQaEvaluationCreates()', () => {
  test('creates an evaluation for every area on first run', () => {
    const result = plan([getArea('a', 1, 1, 0), getArea('b', 1.5, 1.5, 50)])

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
    const result = plan([getArea('a', 1, 1, 0)], {
      a: { systemStatus: 'GOOD', userStatus: null },
    })

    expect(result).toEqual([])
  })

  test('skips areas whose relative changed but status stayed the same', () => {
    const result = plan([getArea('a', 1.5, 1.6, 50)], {
      a: { systemStatus: 'PROBLEMATIC', userStatus: null },
    })

    expect(result).toEqual([])
  })

  test('creates an evaluation when the system status changed', () => {
    const result = plan([getArea('a', 1.5, 1, 50), getArea('b', 1, 1, 0)], {
      a: { systemStatus: 'GOOD', userStatus: null },
      b: { systemStatus: 'GOOD', userStatus: null },
    })

    expect(result.map(({ areaId, systemStatus }) => ({ areaId, systemStatus }))).toEqual([
      { areaId: 'a', systemStatus: 'PROBLEMATIC' },
    ])
  })

  test('resets a NOT_OK user decision when the system becomes GOOD', () => {
    const result = plan([getArea('a', 1, 0.6, 0)], {
      a: { systemStatus: 'PROBLEMATIC', userStatus: 'NOT_OK_DATA_ERROR' },
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ areaId: 'a', systemStatus: 'GOOD', userStatus: null })
  })

  test('never creates over an OK_STRUCTURAL_CHANGE user decision', () => {
    const result = plan([getArea('a', 1, 0.4, 0), getArea('b', 1.5, 1, 50)], {
      a: { systemStatus: 'PROBLEMATIC', userStatus: 'OK_STRUCTURAL_CHANGE' },
      b: { systemStatus: 'GOOD', userStatus: 'OK_STRUCTURAL_CHANGE' },
    })

    expect(result).toEqual([])
  })
})
