import { describe, expect, test } from 'vitest'
import { createSourceKeyTilda, parseSourceKeyTilda } from './sourceKeyUtilsTilda'

describe('parseSourceKeyTilda()', () => {
  test('work when used with the right input', () => {
    const input = createSourceKeyTilda('poi', 'atlas_barriers', 'bikelanes')
    const { categoryId, sourceId, subcategoryId } = parseSourceKeyTilda(input)
    expect(categoryId).toMatch('poi')
    expect(sourceId).toMatch('atlas_barriers')
    expect(subcategoryId).toMatch('bikelanes')
  })
})
