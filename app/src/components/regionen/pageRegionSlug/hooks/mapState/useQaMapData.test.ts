import { describe, expect, test } from 'vitest'
import type { QaIndicatorStatusPair } from '@/shared/qaIndicatorStatus'
import { encodeQaStatusLetters } from '@/shared/qaIndicatorStatus'
import {
  applyQaDecisionsToMapRow,
  qaMapRowMatchesStatus,
  resolveQaIndicatorPairs,
  restoreQaMapDataRow,
  selectQaIndicatorPairs,
  upsertQaMapDataRow,
  type QaMapDataRow,
} from './useQaMapData'

const indicators = [{ key: 'total' }, { key: 'surface' }, { key: 'access' }]

const pair = (
  systemStatus: QaIndicatorStatusPair['systemStatus'],
  userStatus: QaIndicatorStatusPair['userStatus'] = null,
) => ({ systemStatus, userStatus })

describe('resolveQaIndicatorPairs', () => {
  test('backfills the default (all Gut) for a missing row only when the payload is the full config', () => {
    expect(resolveQaIndicatorPairs(undefined, 3, true)).toEqual([
      pair('GOOD'),
      pair('GOOD'),
      pair('GOOD'),
    ])
    expect(resolveQaIndicatorPairs(undefined, 3, false)).toBeUndefined()
  })
})

describe('selectQaIndicatorPairs', () => {
  const pairs = [pair('GOOD'), pair('PROBLEMATIC'), pair('NEEDS_REVIEW')]

  test('keeps the pairs of the selected indicators in config order, or all without a selection (Alle Attribute)', () => {
    expect(selectQaIndicatorPairs(pairs, indicators, undefined)).toEqual(pairs)
    expect(selectQaIndicatorPairs(pairs, indicators, [])).toEqual(pairs)
    expect(selectQaIndicatorPairs(pairs, indicators, ['access', 'total'])).toEqual([
      pair('GOOD'),
      pair('NEEDS_REVIEW'),
    ])
  })
})

describe('qaMapRowMatchesStatus', () => {
  test('matches when ANY selected indicator matches (not just the worst one)', () => {
    const pairs = [pair('GOOD'), pair('NEEDS_REVIEW')]
    expect(qaMapRowMatchesStatus(pairs, 'pending-needs-review')).toBe(true)
    expect(qaMapRowMatchesStatus([pair('GOOD'), pair('PROBLEMATIC')], 'pending-needs-review')).toBe(
      false,
    )
  })

  test('user-status filters ignore system Gut', () => {
    expect(qaMapRowMatchesStatus([pair('GOOD')], 'ok-construction')).toBe(false)
    expect(
      qaMapRowMatchesStatus([pair('NEEDS_REVIEW', 'OK_STRUCTURAL_CHANGE')], 'ok-construction'),
    ).toBe(true)
  })
})

describe('applyQaDecisionsToMapRow', () => {
  test('updates only the letters of the decided indicators, keeps the others', () => {
    const row: QaMapDataRow = {
      areaId: '1',
      ...encodeQaStatusLetters([pair('PROBLEMATIC'), pair('NEEDS_REVIEW'), pair('GOOD')]),
    }
    const next = applyQaDecisionsToMapRow(
      row,
      '1',
      indicators,
      [{ indicatorKey: 'total', userStatus: 'OK_STRUCTURAL_CHANGE' }],
      true,
    )
    expect(next.areaId).toBe('1')
    expect(next).toEqual({
      areaId: '1',
      ...encodeQaStatusLetters([
        pair('PROBLEMATIC', 'OK_STRUCTURAL_CHANGE'),
        pair('NEEDS_REVIEW'),
        pair('GOOD'),
      ]),
    })
  })

  test('starts from the map default when the area had no row yet', () => {
    const next = applyQaDecisionsToMapRow(
      undefined,
      '9',
      indicators,
      [{ indicatorKey: 'surface', userStatus: 'NOT_OK_DATA_ERROR' }],
      true,
    )
    expect(next).toEqual({
      areaId: '9',
      ...encodeQaStatusLetters([pair('GOOD'), pair('GOOD', 'NOT_OK_DATA_ERROR'), pair('GOOD')]),
    })
  })
})

describe('upsertQaMapDataRow / restoreQaMapDataRow', () => {
  const goodDefault: QaMapDataRow = { areaId: '1', sys: 'G', usr: '.' }
  const needsReview: QaMapDataRow = { areaId: '2', sys: 'N', usr: '.' }
  const userOk: QaMapDataRow = { areaId: '3', sys: 'N', usr: 'S' }

  test('appends when the area is missing (exceptions-only payload)', () => {
    expect(upsertQaMapDataRow([needsReview], userOk)).toEqual([needsReview, userOk])
  })

  test('puts a previous row back on rollback, or removes it if there was none', () => {
    const optimistic = { ...needsReview, usr: 'S' }
    expect(restoreQaMapDataRow([goodDefault, optimistic], needsReview.areaId, needsReview)).toEqual(
      [goodDefault, needsReview],
    )
    expect(restoreQaMapDataRow([needsReview, userOk], userOk.areaId, undefined)).toEqual([
      needsReview,
    ])
  })
})
