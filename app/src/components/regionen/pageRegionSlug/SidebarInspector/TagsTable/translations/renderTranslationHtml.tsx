import type { ReactNode } from 'react'
import { Markdown } from '@/components/shared/text/Markdown'
import { TRANSLATION_BREAK_MARKER } from './translationBreakMarker'

/** Soft hyphens + inline markdown (`` `code` ``) for inspector topic-doc labels/values. */
export const renderTranslationHtml = (text: string): ReactNode => {
  const markdown = text.replaceAll(TRANSLATION_BREAK_MARKER, '\u00AD')

  // Plain labels stay as text nodes so table cells keep inherited typography.
  if (!/`/.test(markdown)) {
    return markdown
  }

  return <Markdown markdown={markdown} inline />
}
