import { ChatBubbleLeftIcon } from '@heroicons/react/20/solid'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = {
  children: ReactNode
  /** Solid fill (QA status). Implies white text; omit for the default gray wash. */
  backgroundColor?: string
} & ComponentPropsWithoutRef<'span'>

/** Capsule chip for mode lists and headers (status, comments, open/closed). */
export const ModePanelPill = ({ children, className, backgroundColor, style, ...props }: Props) => (
  <span
    className={twMerge(
      'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
      backgroundColor ? 'text-white' : 'bg-gray-100 text-gray-700',
      className,
    )}
    style={backgroundColor ? { ...style, backgroundColor } : style}
    {...props}
  >
    {children}
  </span>
)

export const ModeCommentsPill = ({ count }: { count: number }) => {
  const label = `${count} Kommentar${count === 1 ? '' : 'e'}`
  return (
    <ModePanelPill aria-label={label} title={label}>
      <ChatBubbleLeftIcon className="size-3.5" aria-hidden="true" />
      {count}
    </ModePanelPill>
  )
}
