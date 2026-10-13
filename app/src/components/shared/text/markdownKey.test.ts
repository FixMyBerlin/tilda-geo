import { describe, expect, test } from 'vitest'
import { parseMarkdownKey } from './markdownKey'

describe('parseMarkdownKey', () => {
  test('strips the suffix from Markdown keys', () => {
    expect(parseMarkdownKey('foo_markdown')).toEqual({ label: 'foo', isMarkdown: true })
    expect(parseMarkdownKey('befahrung_links_markdown')).toEqual({
      label: 'befahrung_links',
      isMarkdown: true,
    })
  })

  test('leaves other keys untouched', () => {
    expect(parseMarkdownKey('name')).toEqual({ label: 'name', isMarkdown: false })
    expect(parseMarkdownKey('markdown')).toEqual({
      label: 'markdown',
      isMarkdown: false,
    })
    expect(parseMarkdownKey('_markdown')).toEqual({
      label: '_markdown',
      isMarkdown: false,
    })
    expect(parseMarkdownKey('foo_markdown_note')).toEqual({
      label: 'foo_markdown_note',
      isMarkdown: false,
    })
  })
})
