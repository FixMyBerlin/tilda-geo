import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { twJoin, twMerge } from 'tailwind-merge'

const calloutTones = {
  info: {
    container: 'border-sky-200 bg-sky-50 text-sky-950',
    icon: 'text-sky-600',
    Icon: InformationCircleIcon,
  },
  warning: {
    container: 'border-amber-300 bg-amber-50 text-amber-950',
    icon: 'text-amber-600',
    Icon: ExclamationTriangleIcon,
  },
  neutral: {
    container: 'border-gray-200 bg-gray-50 text-gray-900',
    icon: 'text-gray-500',
    Icon: InformationCircleIcon,
  },
} as const

type CalloutTone = keyof typeof calloutTones

type Props = {
  tone?: CalloutTone
  title?: ReactNode
  children?: ReactNode
  /** Primary action(s) below the body (e.g. a button). */
  actions?: ReactNode
  className?: string
}

/**
 * Inline notice box for panels and forms (login gates, membership hints, …).
 */
export const Callout = ({ tone = 'info', title, children, actions, className }: Props) => {
  const { container, icon, Icon } = calloutTones[tone]

  return (
    <aside role="note" className={twMerge('rounded-md border p-4 shadow-sm', container, className)}>
      <div className="flex gap-3">
        <Icon className={twJoin('mt-0.5 size-5 shrink-0', icon)} aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          {title ? <p className="text-sm leading-snug font-semibold">{title}</p> : null}
          {children ? <div className="space-y-2 text-sm leading-relaxed">{children}</div> : null}
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </aside>
  )
}
