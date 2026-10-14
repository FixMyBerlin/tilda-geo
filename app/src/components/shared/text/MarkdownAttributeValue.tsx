import { twMerge } from 'tailwind-merge'
import { Markdown } from './Markdown'

type Props = {
  markdown: string
  /** Text size and color of the surrounding cell. */
  className?: string
  linkClassNameOverwrite?: string
}

/** Value of a `*_markdown` attribute (see `parseMarkdownKey`) inside a key/value cell: tight spacing, no outer margins. */
export const MarkdownAttributeValue = ({ markdown, className, linkClassNameOverwrite }: Props) => (
  <Markdown
    markdown={markdown}
    className={twMerge(
      'max-w-none wrap-anywhere prose-p:my-1 prose-ol:my-1 prose-ul:my-1 prose-li:my-0 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
      className,
    )}
    linkClassNameOverwrite={linkClassNameOverwrite}
  />
)
