import { describe, expect, test } from 'vitest'
import {
  countNonBlankCommentBodies,
  selectQaOrphanedEvaluationPage,
} from './getQaOrphanedEvaluationsForAdmin.server'

const counts = (overrides: {
  evaluationCount?: number
  commentCount?: number
  userEvaluationCount?: number
}) => ({
  evaluationCount: overrides.evaluationCount ?? 1,
  commentCount: overrides.commentCount ?? 0,
  userEvaluationCount: overrides.userEvaluationCount ?? 0,
})

const latest = (overrides: { areaId: string; createdAt: Date; authorOsmName?: string | null }) => ({
  areaId: overrides.areaId,
  systemStatus: 'NEEDS_REVIEW' as const,
  userStatus: null,
  createdAt: overrides.createdAt,
  evaluatorType: 'SYSTEM' as const,
  author:
    overrides.authorOsmName === undefined
      ? null
      : { osmName: overrides.authorOsmName, firstName: null, lastName: null },
})

describe('selectQaOrphanedEvaluationPage', () => {
  test('keeps evaluations whose areaId is missing from the map table', () => {
    const older = new Date('2024-01-01T00:00:00Z')
    const newer = new Date('2024-06-01T00:00:00Z')
    const result = selectQaOrphanedEvaluationPage(
      [
        latest({ areaId: 'still-on-map', createdAt: newer, authorOsmName: 'mapper' }),
        latest({ areaId: 'orphan-a', createdAt: older }),
      ],
      new Set(['still-on-map']),
      new Map([
        ['still-on-map', counts({ evaluationCount: 2 })],
        ['orphan-a', counts({ evaluationCount: 3, commentCount: 1, userEvaluationCount: 1 })],
      ]),
      0,
      50,
    )

    expect(result.total).toBe(1)
    expect(result.rows).toEqual([
      {
        areaId: 'orphan-a',
        systemStatus: 'NEEDS_REVIEW',
        userStatus: null,
        createdAt: older,
        evaluatorType: 'SYSTEM',
        authorOsmName: null,
        authorFirstName: null,
        authorLastName: null,
        evaluationCount: 3,
        commentCount: 1,
        userEvaluationCount: 1,
      },
    ])
    expect(result.skip).toBe(0)
    expect(result.take).toBe(50)
  })

  test('sorts human work first, then recency, then paginates', () => {
    const t1 = new Date('2024-01-01T00:00:00Z')
    const t2 = new Date('2024-02-01T00:00:00Z')
    const t3 = new Date('2024-03-01T00:00:00Z')
    const t4 = new Date('2024-04-01T00:00:00Z')
    const result = selectQaOrphanedEvaluationPage(
      [
        latest({ areaId: 'few-user-evals', createdAt: t4 }),
        latest({ areaId: 'many-comments', createdAt: t3 }),
        latest({ areaId: 'older-same-counts', createdAt: t1 }),
        latest({ areaId: 'newer-same-counts', createdAt: t2 }),
        latest({ areaId: 'on-map', createdAt: t4 }),
      ],
      new Set(['on-map']),
      new Map([
        ['few-user-evals', counts({ userEvaluationCount: 1, commentCount: 0 })],
        ['many-comments', counts({ userEvaluationCount: 0, commentCount: 5 })],
        ['older-same-counts', counts({ userEvaluationCount: 0, commentCount: 0 })],
        ['newer-same-counts', counts({ userEvaluationCount: 0, commentCount: 0 })],
        ['on-map', counts({ userEvaluationCount: 9 })],
      ]),
      1,
      2,
    )

    expect(result.total).toBe(4)
    expect(result.rows.map((row) => row.areaId)).toEqual(['many-comments', 'newer-same-counts'])
    expect(result.skip).toBe(1)
    expect(result.take).toBe(2)
  })

  test('breaks ties by areaId and falls back to the last page past the end', () => {
    const createdAt = new Date('2024-01-01T00:00:00Z')
    const evaluations = ['c', 'a', 'b'].map((areaId) => latest({ areaId, createdAt }))
    const noCounts = new Map<string, ReturnType<typeof counts>>()

    const all = selectQaOrphanedEvaluationPage(evaluations, new Set(), noCounts, 0, 50)
    expect(all.rows.map((row) => row.areaId)).toEqual(['a', 'b', 'c'])

    const pastEnd = selectQaOrphanedEvaluationPage(evaluations, new Set(), noCounts, 500, 2)
    expect(pastEnd.rows.map((row) => row.areaId)).toEqual(['c'])
    expect(pastEnd.skip).toBe(2)
  })
})

describe('countNonBlankCommentBodies', () => {
  test('does not count null, empty, or whitespace-only bodies', () => {
    const counts = countNonBlankCommentBodies([
      { areaId: 'a', body: 'hello' },
      { areaId: 'a', body: '  ' },
      { areaId: 'a', body: '\n\t' },
      { areaId: 'a', body: '' },
      { areaId: 'a', body: null },
      { areaId: 'b', body: '  x  ' },
    ])

    expect(counts.get('a')).toBe(1)
    expect(counts.get('b')).toBe(1)
    expect(counts.has('c')).toBe(false)
  })
})
