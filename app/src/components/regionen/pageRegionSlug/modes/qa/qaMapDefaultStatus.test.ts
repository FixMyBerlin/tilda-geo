import { describe, expect, test } from 'vitest'
import type { QaMapData } from '@/server/qa-configs/queries/getQaDataForMap.server'
import { SYSTEM_STATUS_TO_LETTER, USER_STATUS_TO_LETTER } from './detail/qaConfigs'
import {
  isQaMapDefaultStatus,
  qaMapPayloadAppliesDefault,
  QA_MAP_DEFAULT_STATUS,
  resolveQaMapStatus,
} from './qaMapDefaultStatus'

const exception = {
  areaId: '42',
  systemStatus: SYSTEM_STATUS_TO_LETTER.NEEDS_REVIEW,
  userStatus: null,
} satisfies QaMapData

describe('isQaMapDefaultStatus', () => {
  test('matches Gut with no user decision', () => {
    expect(isQaMapDefaultStatus(QA_MAP_DEFAULT_STATUS)).toBe(true)
  })

  test('rejects a user decision on an otherwise Gut area', () => {
    expect(
      isQaMapDefaultStatus({
        systemStatus: SYSTEM_STATUS_TO_LETTER.GOOD,
        userStatus: USER_STATUS_TO_LETTER.OK_STRUCTURAL_CHANGE,
      }),
    ).toBe(false)
  })

  test('rejects other system statuses', () => {
    expect(isQaMapDefaultStatus(exception)).toBe(false)
  })
})

describe('qaMapPayloadAppliesDefault', () => {
  test('applies when the payload is the full config', () => {
    expect(qaMapPayloadAppliesDefault({})).toBe(true)
    expect(qaMapPayloadAppliesDefault({ search: '', userIds: [] })).toBe(true)
  })

  test('does not apply when search or users subset the payload', () => {
    expect(qaMapPayloadAppliesDefault({ search: '123' })).toBe(false)
    expect(qaMapPayloadAppliesDefault({ userIds: ['u1'] })).toBe(false)
  })
})

describe('resolveQaMapStatus', () => {
  test('prefers the payload row', () => {
    expect(resolveQaMapStatus(exception, true)).toEqual(exception)
  })

  test('fills Gut when the payload omitted the default', () => {
    expect(resolveQaMapStatus(undefined, true)).toEqual(QA_MAP_DEFAULT_STATUS)
  })

  test('stays absent when the payload is a subset', () => {
    expect(resolveQaMapStatus(undefined, false)).toBeUndefined()
  })
})
