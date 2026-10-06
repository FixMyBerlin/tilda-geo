import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { modePanelMutedClassName } from './modePanel.const'

type ModeCommentBylineProps = {
  author: ReactNode
  date: ReactNode
}

/** Author and relative date on one line, below the comment body. */
const ModeCommentByline = ({ author, date }: ModeCommentBylineProps) => (
  <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
    <div className="text-sm font-medium text-gray-700">{author}</div>
    <div className={modePanelMutedClassName}>{date}</div>
  </div>
)

type Props = {
  actions?: ReactNode
  body: ReactNode
  author: ReactNode
  date: ReactNode
  children?: ReactNode
}

/** Markdown (or other body) with optional top-right edit control and a notes-style byline. */
export const ModeComment = ({ actions, body, author, date, children }: Props) => (
  <div className={twJoin('relative', actions && '[&>:nth-child(2)]:pr-12')}>
    {actions ? <div className="absolute top-0 right-0 z-1">{actions}</div> : null}
    {body}
    {children}
    <ModeCommentByline author={author} date={date} />
  </div>
)
