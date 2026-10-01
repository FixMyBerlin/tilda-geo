import { PlusIcon } from '@heroicons/react/24/outline'
import type { MouseEvent, ReactNode } from 'react'

type Props = {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  children: ReactNode
  /** Defaults to a plus, for the »Neu…« row. */
  icon?: ReactNode
  disabled?: boolean
}

/** Action row below a collection list in the mode header disclosure (»Neuer Ordner…«, …). */
export const ModeCollectionActionRow = ({
  onClick,
  children,
  icon = <PlusIcon className="size-4 shrink-0" aria-hidden />,
  disabled,
}: Props) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-white/90 select-none hover:bg-white/10 disabled:cursor-default disabled:opacity-60"
  >
    {icon}
    <span className="min-w-0 truncate">{children}</span>
  </button>
)
