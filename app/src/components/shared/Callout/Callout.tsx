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
  notice: {
    container: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    icon: 'text-yellow-600',
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
  /** Small panel hints (text-xs, tight padding), e.g. in the Flächenfinder panel and inspector. */
  compact?: boolean
  className?: string
}

/**
 * Inline notice box for panels and forms (login gates, membership hints, …).
 */
export const Callout = ({
  tone = 'info',
  title,
  children,
  actions,
  compact = false,
  className,
}: Props) => {
  const { container, icon, Icon } = calloutTones[tone]

  return (
    <aside
      role="note"
      className={twMerge(
        'rounded-md border',
        compact ? 'px-2 py-1.5' : 'p-4 shadow-sm',
        container,
        className,
      )}
    >
      <div className={compact ? 'flex gap-1.5' : 'flex gap-3'}>
        <Icon
          className={twJoin('shrink-0', compact ? 'mt-px size-4' : 'mt-0.5 size-5', icon)}
          aria-hidden
        />
        <div className={twJoin('min-w-0 flex-1', compact ? 'space-y-1.5' : 'space-y-3')}>
          {title ? (
            <p className={twJoin('leading-snug font-semibold', compact ? 'text-xs' : 'text-sm')}>
              {title}
            </p>
          ) : null}
          {children ? (
            <div
              className={
                compact ? 'space-y-1 text-xs leading-snug' : 'space-y-2 text-sm leading-relaxed'
              }
            >
              {children}
            </div>
          ) : null}
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </aside>
  )
}
