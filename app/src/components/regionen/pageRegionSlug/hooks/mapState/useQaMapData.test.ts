import { describe, expect, test } from 'vitest'
import {
  SYSTEM_STATUS_TO_LETTER,
  USER_STATUS_TO_LETTER,
} from '@/components/regionen/pageRegionSlug/modes/qa/detail/qaConfigs'
import { QA_MAP_DEFAULT_STATUS } from '@/components/regionen/pageRegionSlug/modes/qa/qaMapDefaultStatus'
import type { QaMapData } from '@/server/qa-configs/queries/getQaDataForMap.server'
import { qaMapRowMatchesStatus, restoreQaMapDataRow, upsertQaMapDataRow } from './useQaMapData'

const goodDefault = {
  areaId: '1',
  ...QA_MAP_DEFAULT_STATUS,
} satisfies QaMapData

const needsReview = {
  areaId: '2',
  systemStatus: SYSTEM_STATUS_TO_LETTER.NEEDS_REVIEW,
  userStatus: null,
} satisfies QaMapData

const userOk = {
  areaId: '3',
  systemStatus: SYSTEM_STATUS_TO_LETTER.NEEDS_REVIEW,
  userStatus: USER_STATUS_TO_LETTER.OK_STRUCTURAL_CHANGE,
} satisfies QaMapData

describe('qaMapRowMatchesStatus', () => {
  test('Alle Status matches every row, including the omitted Gut default', () => {
    expect(qaMapRowMatchesStatus(goodDefault, undefined)).toBe(true)
    expect(qaMapRowMatchesStatus(needsReview, undefined)).toBe(true)
  })

  test('pending-needs-review does not match the Gut default', () => {
    expect(qaMapRowMatchesStatus(goodDefault, 'pending-needs-review')).toBe(false)
    expect(qaMapRowMatchesStatus(needsReview, 'pending-needs-review')).toBe(true)
  })

  test('user-status filters ignore system Gut', () => {
    expect(qaMapRowMatchesStatus(goodDefault, 'ok-construction')).toBe(false)
    expect(qaMapRowMatchesStatus(userOk, 'ok-construction')).toBe(true)
  })
})

describe('upsertQaMapDataRow', () => {
  test('replaces an existing area row', () => {
    const next = { ...needsReview, userStatus: USER_STATUS_TO_LETTER.OK_STRUCTURAL_CHANGE }
    expect(upsertQaMapDataRow<QaMapData>([goodDefault, needsReview], next)).toEqual([
      goodDefault,
      next,
    ])
  })

  test('appends when the area is missing (exceptions-only payload)', () => {
    expect(upsertQaMapDataRow<QaMapData>([needsReview], userOk)).toEqual([needsReview, userOk])
  })
})

describe('restoreQaMapDataRow', () => {
  test('puts a previous system-status exception back', () => {
    const optimistic = {
      ...needsReview,
      userStatus: USER_STATUS_TO_LETTER.OK_STRUCTURAL_CHANGE,
    }
    expect(
      restoreQaMapDataRow<QaMapData>([goodDefault, optimistic], needsReview.areaId, needsReview),
    ).toEqual([goodDefault, needsReview])
  })

  test('removes the area when there was no previous row', () => {
    expect(restoreQaMapDataRow<QaMapData>([needsReview, userOk], userOk.areaId, undefined)).toEqual(
      [needsReview],
    )
  })
})
