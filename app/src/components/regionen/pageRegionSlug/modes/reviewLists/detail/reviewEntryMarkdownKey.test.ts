import { describe, expect, test } from 'vitest'
import { parseReviewEntryPropertyKey } from './reviewEntryMarkdownKey'

describe('parseReviewEntryPropertyKey', () => {
  test('strips the suffix from Markdown keys', () => {
    expect(parseReviewEntryPropertyKey('foo_markdown')).toEqual({ label: 'foo', isMarkdown: true })
    expect(parseReviewEntryPropertyKey('befahrung_links_markdown')).toEqual({
      label: 'befahrung_links',
      isMarkdown: true,
    })
  })

  test('leaves other keys untouched', () => {
    expect(parseReviewEntryPropertyKey('name')).toEqual({ label: 'name', isMarkdown: false })
    expect(parseReviewEntryPropertyKey('markdown')).toEqual({
      label: 'markdown',
      isMarkdown: false,
    })
    expect(parseReviewEntryPropertyKey('_markdown')).toEqual({
      label: '_markdown',
      isMarkdown: false,
    })
    expect(parseReviewEntryPropertyKey('foo_markdown_note')).toEqual({
      label: 'foo_markdown_note',
      isMarkdown: false,
    })
  })
})
