const MARKDOWN_KEY_SUFFIX = '_markdown'

/** Attribute keys named `*_markdown` hold Markdown; the suffix is a render hint, not part of the label. */
export const parseReviewEntryPropertyKey = (key: string) => {
  const isMarkdown = key.endsWith(MARKDOWN_KEY_SUFFIX) && key.length > MARKDOWN_KEY_SUFFIX.length
  return {
    label: isMarkdown ? key.slice(0, -MARKDOWN_KEY_SUFFIX.length) : key,
    isMarkdown,
  }
}
