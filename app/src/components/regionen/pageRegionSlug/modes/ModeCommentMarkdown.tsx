import { twJoin, twMerge } from 'tailwind-merge'
import { inheritLinkStyles } from '@/components/shared/links/styles'
import { Markdown } from '@/components/shared/text/Markdown'
import { modePanelTintContentRailClassName } from './modePanel.const'

type Props = {
  markdown?: string | null
  className?: string
  /** Hinweise: left rail; links match surrounding text. Omit for QA / Prüflisten so those stay unbordered. */
  variant?: 'default' | 'notes'
}

const commentMarkdownClasses = twJoin(
  'prose-sm min-w-0 wrap-anywhere prose-p:leading-tight prose-p:text-gray-700 prose-a:wrap-anywhere prose-ol:leading-tight prose-ul:leading-tight prose-li:m-0',
)

const notesVariantClasses = twJoin(
  `${modePanelTintContentRailClassName} prose-a:text-inherit prose-a:underline prose-a:decoration-current prose-a:underline-offset-4 prose-a:hover:text-gray-950 prose-ol:list-inside prose-ol:ps-0 prose-ul:my-1 prose-ul:list-inside prose-ul:ps-0 prose-li:ps-0 prose-li:marker:text-white/80`,
)

export const ModeCommentMarkdown = ({ markdown, className, variant = 'default' }: Props) => (
  <Markdown
    markdown={markdown}
    className={twMerge(
      commentMarkdownClasses,
      variant === 'notes' ? notesVariantClasses : undefined,
      className,
    )}
    linkClassNameOverwrite={inheritLinkStyles}
  />
)
