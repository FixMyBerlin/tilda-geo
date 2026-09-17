import type { ReactNode } from 'react'
import { modePanelMutedClassName } from '@/components/regionen/pageRegionSlug/modes/modePanel.const'

type Props = {
  author: ReactNode
  date: ReactNode
}

/** Author and relative date on one line. */
export const NotesCommentByline = ({ author, date }: Props) => (
  <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
    <div className="text-sm font-medium text-gray-700">{author}</div>
    <div className={modePanelMutedClassName}>{date}</div>
  </div>
)
