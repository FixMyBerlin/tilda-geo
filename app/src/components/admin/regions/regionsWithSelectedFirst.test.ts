import { describe, expect, test } from 'vitest'
import { regionsWithSelectedFirst } from './regionsWithSelectedFirst'

describe('regionsWithSelectedFirst', () => {
  test('moves selected slugs to the top and keeps relative order', () => {
    const regions = [{ slug: 'bb' }, { slug: 'berlin' }, { slug: 'parkraum-berlin-euvm' }]
    expect(regionsWithSelectedFirst(regions, ['parkraum-berlin-euvm']).map((r) => r.slug)).toEqual([
      'parkraum-berlin-euvm',
      'bb',
      'berlin',
    ])
  })
})
