import { describe, expect, test } from 'vitest'
import {
  formatParkingConditionCategorySegment,
  parseParkingConditionCategorySegment,
  resolveParkingConditionCategoryBase,
  resolveParkingConditionDetailToken,
  splitParkingConditionCategoryValue,
} from './parkingConditionCategorySegment'

const tCat = (baseKey: string) => {
  const label = resolveParkingConditionCategoryBase(baseKey)
  if (label === undefined) {
    throw new Error(`expected category base for ${JSON.stringify(baseKey)}`)
  }
  return label
}

const tTok = (tokenId: string) => {
  const label = resolveParkingConditionDetailToken(tokenId)
  if (label === undefined) {
    throw new Error(`expected detail token for ${JSON.stringify(tokenId)}`)
  }
  return label
}

describe('formatParkingConditionCategorySegment (Lua examples)', () => {
  test('access_restriction (agricultural)', () => {
    expect(
      formatParkingConditionCategorySegment(
        'access_restriction (agricultural)',
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    ).toBe(`${tCat('access_restriction')} (${tTok('agricultural')})`)
  })

  test('access_restriction (no, Tu 15:00-18:00)', () => {
    expect(
      formatParkingConditionCategorySegment(
        'access_restriction (no, Tu 15:00-18:00)',
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    ).toBe(`${tCat('access_restriction')} (${tTok('no')}, Dienstag 15:00-18:00)`)
  })

  test('access_restriction (Mo-Fr 04:30-20:00, PH off)', () => {
    expect(
      formatParkingConditionCategorySegment(
        'access_restriction (Mo-Fr 04:30-20:00, PH off)',
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    ).toBe(`${tCat('access_restriction')} (Montag-Freitag 04:30-20:00, Feiertag ausgenommen)`)
  })

  test('disabled (except emergency)', () => {
    expect(
      formatParkingConditionCategorySegment(
        'disabled (except emergency)',
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    ).toBe(`${tCat('disabled')} (${tTok('except')} ${tTok('emergency')})`)
  })

  test('paid (stay > 1 hour)', () => {
    expect(
      formatParkingConditionCategorySegment(
        'paid (stay > 1 hour)',
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    ).toBe(`${tCat('paid')} (${tTok('stay')} > 1 ${tTok('hour')})`)
  })

  test('time_limited (2 days)', () => {
    expect(
      formatParkingConditionCategorySegment(
        'time_limited (2 days)',
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    ).toBe(`${tCat('time_limited')} (2 ${tTok('days')})`)
  })

  test('time_limited (4 hours) (08:00-18:00)', () => {
    expect(
      formatParkingConditionCategorySegment(
        'time_limited (4 hours) (08:00-18:00)',
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    ).toBe(`${tCat('time_limited')} (4 ${tTok('hours')}) (08:00-18:00)`)
  })

  test('vehicle_restriction (only motorcar, motorcycle)', () => {
    expect(
      formatParkingConditionCategorySegment(
        'vehicle_restriction (only motorcar, motorcycle)',
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    ).toBe(
      `${tCat('vehicle_restriction')} (${tTok('only')} ${tTok('motorcar')}, ${tTok('motorcycle')})`,
    )
  })

  test('vehicle_restriction (only delivery) (Mo-Sa 07:00-20:00)', () => {
    expect(
      formatParkingConditionCategorySegment(
        'vehicle_restriction (only delivery) (Mo-Sa 07:00-20:00)',
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    ).toBe(
      `${tCat('vehicle_restriction')} (${tTok('only')} ${tTok('delivery')}) (Montag-Samstag 07:00-20:00)`,
    )
  })
})

describe('formatParkingConditionCategorySegment (edge cases)', () => {
  test('plain paid', () => {
    expect(
      formatParkingConditionCategorySegment(
        'paid',
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    ).toBe(tCat('paid'))
  })

  test('plain free', () => {
    expect(
      formatParkingConditionCategorySegment(
        'free',
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    ).toBe(tCat('free'))
  })

  test('multi-segment after semicolon split formats each item', () => {
    const raw = 'paid;free'
    const parts = splitParkingConditionCategoryValue(raw)
    expect(parts).toEqual(['paid', 'free'])
    const formatted = parts.map((p) =>
      formatParkingConditionCategorySegment(
        p,
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    )
    expect(formatted).toEqual([tCat('paid'), tCat('free')])
  })

  test('unbalanced parentheses fall back to raw segment', () => {
    const input = 'paid (stay > 1 hour'
    expect(parseParkingConditionCategorySegment(input)).toEqual({
      base: null,
      detailGroups: [],
      raw: input,
    })
    expect(
      formatParkingConditionCategorySegment(
        input,
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    ).toBe(input)
  })
})

describe('Lua classify_parking_conditions: semicolon vs comma', () => {
  test('semicolon inside one opening_hours fragment stays one segment (not a Lua class separator)', () => {
    const raw = 'no_parking (Mo-Fr 08:00-18:00; Sa 09:00-14:00)'
    expect(splitParkingConditionCategoryValue(raw)).toEqual([raw])
    expect(
      formatParkingConditionCategorySegment(
        raw,
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    ).toBe(`${tCat('no_parking')} (Montag-Freitag 08:00-18:00; Samstag 09:00-14:00)`)
  })

  test('Lua table.concat(condition_class, ";") — two classes, no space after semicolon (classify_parking_conditions.test.lua)', () => {
    const raw = 'no_parking (Mo-Fr 08:00-18:00);loading (Mo-Fr 12:00-14:00)'
    expect(splitParkingConditionCategoryValue(raw)).toEqual([
      'no_parking (Mo-Fr 08:00-18:00)',
      'loading (Mo-Fr 12:00-14:00)',
    ])
    const formatted = splitParkingConditionCategoryValue(raw).map((p) =>
      formatParkingConditionCategorySegment(
        p,
        resolveParkingConditionCategoryBase,
        resolveParkingConditionDetailToken,
      ),
    )
    expect(formatted).toEqual([
      `${tCat('no_parking')} (Montag-Freitag 08:00-18:00)`,
      `${tCat('loading')} (Montag-Freitag 12:00-14:00)`,
    ])
  })
})
