import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'
import { MarkdownDocumentHeadingLink } from './MarkdownDocumentHeadingLink'

type HeadingTagName = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

type Props = {
  as: HeadingTagName
  id: string
  className?: string
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<'h1'>, 'id' | 'className' | 'children'>

export const DocumentHeading = ({ as: Tag, id, className, children, ...props }: Props) => (
  <Tag
    id={id}
    className={twMerge('group flex scroll-mt-28 items-baseline gap-2', className)}
    {...props}
  >
    <span className="min-w-0">{children}</span>
    <MarkdownDocumentHeadingLink hash={id} />
  </Tag>
)
