import { describe, expect, test } from 'vitest'
import { formatLinkedRegionsHint } from './linkedRegionsHint'

describe('formatLinkedRegionsHint', () => {
  test('omits the hint when the list is not shared', () => {
    expect(formatLinkedRegionsHint([])).toBeUndefined()
    expect(formatLinkedRegionsHint(['Nur eine'])).toBeUndefined()
  })

  test('joins two or more region names', () => {
    expect(formatLinkedRegionsHint(['Alpha', 'Beta'])).toBe(
      'Diese Liste ist mit den Regionen »Alpha« und »Beta« verknüpft.',
    )
    expect(formatLinkedRegionsHint(['Alpha', 'Beta', 'Gamma'])).toBe(
      'Diese Liste ist mit den Regionen »Alpha«, »Beta« und »Gamma« verknüpft.',
    )
  })
})
