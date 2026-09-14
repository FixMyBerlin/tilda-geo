import { twJoin, twMerge } from 'tailwind-merge'
import { Markdown } from '@/components/shared/text/Markdown'

type Props = {
  markdown?: string | null
  className?: string
  /** Internal notes: left rule + yellow link hover. Omit for QA / Prüflisten so those stay unbordered. */
  variant?: 'default' | 'notes'
}

const commentMarkdownClasses = twJoin(
  'prose-sm prose-p:leading-tight prose-p:text-gray-700 prose-ol:leading-tight prose-ul:leading-tight prose-li:m-0',
)

const notesVariantClasses = twJoin(
  'border-l-4 border-gray-200 pl-3 prose-a:underline hover:prose-a:text-yellow-700 hover:prose-a:decoration-yellow-700',
)

export const ModeCommentMarkdown = ({ markdown, className, variant = 'default' }: Props) => (
  <Markdown
    markdown={markdown}
    className={twMerge(
      commentMarkdownClasses,
      variant === 'notes' ? notesVariantClasses : undefined,
      className,
    )}
  />
)
