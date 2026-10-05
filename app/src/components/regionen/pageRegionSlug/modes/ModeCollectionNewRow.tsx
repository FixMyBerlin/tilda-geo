import { PlusIcon } from '@heroicons/react/24/outline'
import type { MouseEvent, ReactNode } from 'react'

type Props = {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  children: ReactNode
}

/** Trailing »Neu…« row below a collection list in the mode header disclosure. */
export const ModeCollectionNewRow = ({ onClick, children }: Props) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-white/90 select-none hover:bg-white/10"
  >
    <PlusIcon className="size-4 shrink-0" aria-hidden />
    <span>{children}</span>
  </button>
)
