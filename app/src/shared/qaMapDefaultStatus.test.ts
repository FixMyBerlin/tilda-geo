import { describe, expect, test } from 'vitest'
import { encodeQaStatusLetters, isQaMapDefaultLetters } from './qaIndicatorStatus'
import { qaMapDefaultIndicatorPairs, qaMapPayloadAppliesDefault } from './qaMapDefaultStatus'

describe('qaMapDefaultIndicatorPairs', () => {
  test('matches the map payload default letters', () => {
    const { sys, usr } = encodeQaStatusLetters(qaMapDefaultIndicatorPairs(2))
    expect(isQaMapDefaultLetters(sys, usr)).toBe(true)
  })
})

describe('qaMapPayloadAppliesDefault', () => {
  test('applies when the payload is the full config, not when search or users subset it', () => {
    expect(qaMapPayloadAppliesDefault({})).toBe(true)
    expect(qaMapPayloadAppliesDefault({ search: '', userIds: [] })).toBe(true)
    expect(qaMapPayloadAppliesDefault({ search: '123' })).toBe(false)
    expect(qaMapPayloadAppliesDefault({ userIds: ['u1'] })).toBe(false)
  })
})
