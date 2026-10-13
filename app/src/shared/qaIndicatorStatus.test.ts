import { describe, expect, test } from 'vitest'
import {
  decodeQaStatusLetters,
  encodeQaStatusLetters,
  isOpenQaIndicator,
  isQaMapDefaultLetters,
  worstQaIndicatorStatus,
} from './qaIndicatorStatus'

const pair = (
  systemStatus: 'GOOD' | 'NEEDS_REVIEW' | 'PROBLEMATIC' | 'TRUSTED_EDITOR_CHANGE',
  userStatus = null as never,
) => ({ systemStatus, userStatus }) as const

describe('letter payload', () => {
  test('encodes one letter per indicator, in config order', () => {
    expect(
      encodeQaStatusLetters([
        { systemStatus: 'NEEDS_REVIEW', userStatus: null },
        { systemStatus: 'GOOD', userStatus: 'OK_STRUCTURAL_CHANGE' },
        { systemStatus: 'PROBLEMATIC', userStatus: 'NOT_OK_DATA_ERROR' },
        { systemStatus: 'TRUSTED_EDITOR_CHANGE', userStatus: null },
      ]),
    ).toEqual({ sys: 'NGPT', usr: '.SD.' })
  })

  test('round-trips through decode', () => {
    const indicators = [
      { systemStatus: 'GOOD', userStatus: null },
      { systemStatus: 'PROBLEMATIC', userStatus: 'OK_QA_TOOLING_ERROR' },
      { systemStatus: 'TRUSTED_EDITOR_CHANGE', userStatus: null },
    ] as const
    const { sys, usr } = encodeQaStatusLetters([...indicators])
    expect(decodeQaStatusLetters(sys, usr)).toEqual(indicators)
  })

  test('falls back to the map default for unknown or missing letters', () => {
    expect(decodeQaStatusLetters('GX', '')).toEqual([
      { systemStatus: 'GOOD', userStatus: null },
      { systemStatus: 'GOOD', userStatus: null },
    ])
  })

  test('recognises the omitted default cell', () => {
    expect(isQaMapDefaultLetters('GGG', '...')).toBe(true)
    expect(isQaMapDefaultLetters('GNG', '...')).toBe(false)
    expect(isQaMapDefaultLetters('GGG', '.S.')).toBe(false)
    expect(isQaMapDefaultLetters('', '')).toBe(true)
    expect(isQaMapDefaultLetters('GTG', '...')).toBe(false)
  })
})

describe('worstQaIndicatorStatus()', () => {
  test('a user NOT_OK beats every system status', () => {
    expect(
      worstQaIndicatorStatus([
        { systemStatus: 'PROBLEMATIC', userStatus: null },
        { systemStatus: 'GOOD', userStatus: 'NOT_OK_DATA_ERROR' },
      ]),
    ).toEqual({ systemStatus: 'GOOD', userStatus: 'NOT_OK_DATA_ERROR' })
  })

  test('a reviewed indicator never hides an open problem on another one, but outranks a GOOD one', () => {
    expect(
      worstQaIndicatorStatus([
        { systemStatus: 'PROBLEMATIC', userStatus: 'OK_STRUCTURAL_CHANGE' },
        { systemStatus: 'NEEDS_REVIEW', userStatus: null },
      ]),
    ).toEqual({ systemStatus: 'NEEDS_REVIEW', userStatus: null })
    expect(
      worstQaIndicatorStatus([
        pair('GOOD'),
        { systemStatus: 'PROBLEMATIC', userStatus: 'OK_REFERENCE_ERROR' },
      ]),
    ).toEqual({ systemStatus: 'PROBLEMATIC', userStatus: 'OK_REFERENCE_ERROR' })
  })

  test('TRUSTED_EDITOR_CHANGE outranks GOOD but not an open problem', () => {
    expect(worstQaIndicatorStatus([pair('GOOD'), pair('TRUSTED_EDITOR_CHANGE')])).toEqual(
      pair('TRUSTED_EDITOR_CHANGE'),
    )
    expect(worstQaIndicatorStatus([pair('TRUSTED_EDITOR_CHANGE'), pair('NEEDS_REVIEW')])).toEqual(
      pair('NEEDS_REVIEW'),
    )
  })

  test('TRUSTED_EDITOR_CHANGE ranks equal to a user OK, so the config order decides', () => {
    const userOk = { systemStatus: 'PROBLEMATIC', userStatus: 'OK_STRUCTURAL_CHANGE' } as const
    expect(worstQaIndicatorStatus([pair('TRUSTED_EDITOR_CHANGE'), userOk])).toEqual(
      pair('TRUSTED_EDITOR_CHANGE'),
    )
    expect(worstQaIndicatorStatus([userOk, pair('TRUSTED_EDITOR_CHANGE')])).toEqual(userOk)
  })

  test('an empty selection has no winner', () => {
    expect(worstQaIndicatorStatus([])).toBeUndefined()
  })
})

describe('isOpenQaIndicator()', () => {
  test('open = not GOOD and undecided ("Alle offenen als OK")', () => {
    expect(isOpenQaIndicator(pair('NEEDS_REVIEW'))).toBe(true)
    expect(isOpenQaIndicator(pair('GOOD'))).toBe(false)
    expect(isOpenQaIndicator(pair('TRUSTED_EDITOR_CHANGE'))).toBe(false)
    expect(
      isOpenQaIndicator({ systemStatus: 'PROBLEMATIC', userStatus: 'NOT_OK_DATA_ERROR' }),
    ).toBe(false)
  })
})
