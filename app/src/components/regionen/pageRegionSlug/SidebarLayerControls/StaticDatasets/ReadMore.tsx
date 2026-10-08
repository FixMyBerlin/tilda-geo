import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { Markdown } from '@/components/shared/text/Markdown'
import { DetailToggle } from '../DetailToggle'

/**
 * Roughly nine lines in the desktop sidebar; the clamp shows six. A character count instead of
 * measuring the rendered height: simple, at the cost of being a bit off on wider panels.
 */
const READ_MORE_MIN_CHARS = 350

type Props = {
  markdown: string
  /** Tailwind `from-*` color of the surface behind the text, for the fade-out. */
  fadeFromClassName: string
}

/** Clamps long text blobs to a few lines; shorter text renders untouched, without a toggle. */
export const ReadMore = ({ markdown, fadeFromClassName }: Props) => {
  const [expanded, setExpanded] = useState(false)

  const tooLong = markdown.length > READ_MORE_MIN_CHARS
  const clamped = tooLong && !expanded

  return (
    <div className="flex flex-col gap-1">
      <div className={twJoin('relative', clamped && 'max-h-24 overflow-hidden')}>
        <Markdown markdown={markdown} className="text-xs leading-4" />
        {clamped && (
          <div
            aria-hidden
            className={twJoin(
              'pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t to-transparent',
              fadeFromClassName,
            )}
          />
        )}
      </div>
      {tooLong && (
        <DetailToggle
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          label={expanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
          content="above"
        />
      )}
    </div>
  )
}
