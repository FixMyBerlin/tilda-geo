import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'

type Props = {
  actions?: ReactNode
  children: ReactNode
}

/** Comment/note body with optional edit control in the top-right of the markdown. */
export const NotesCommentStack = ({ actions, children }: Props) => (
  <div className={twJoin('relative', actions && '[&>:nth-child(2)]:pr-12')}>
    {actions ? <div className="absolute top-0 right-0 z-1">{actions}</div> : null}
    {children}
  </div>
)
