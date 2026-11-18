/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { ModeListCount, type ModeListCountState } from './ModeListCount'

const nouns = { singular: 'Bereich', plural: 'Bereiche', pluralDative: 'Bereichen' }

const countText = (count: ModeListCountState) => {
  const { unmount } = render(<ModeListCount count={count} nouns={nouns} />)
  const text = screen.getByTestId('mode-list-count').textContent
  unmount()
  return text
}

describe('ModeListCount', () => {
  test('shows a placeholder while the list loads', () => {
    expect(countText({ status: 'loading' })).toBe('…')
  })

  test('uses singular and plural', () => {
    expect(countText({ status: 'counted', shown: 0 })).toBe('0 Bereiche')
    expect(countText({ status: 'counted', shown: 1 })).toBe('1 Bereich')
    expect(countText({ status: 'counted', shown: 23 })).toBe('23 Bereiche')
  })

  test('names the total when the list is capped', () => {
    expect(countText({ status: 'capped', shown: 200, total: 1234 })).toBe('200 von 1.234 Bereichen')
  })

  test('marks a count as a minimum when the source stops at a limit', () => {
    expect(countText({ status: 'atLeast', shown: 100 })).toBe('100+ Bereiche')
  })
})
