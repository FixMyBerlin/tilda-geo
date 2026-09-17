import { twMerge } from 'tailwind-merge'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { formatDateTime } from './formatDate'
import { formatRelativeTime } from './relativeTime'

type Props = {
  date: Date | string | number
  className?: string
  timeClassName?: string
}

export const TimeWithRelativeTooltip = ({ date, className, timeClassName }: Props) => {
  const dateObj = new Date(date)

  return (
    <Tooltip as="span" text={formatDateTime(dateObj)} className={twMerge('inline', className)}>
      <time
        className={twMerge('whitespace-nowrap text-gray-500', timeClassName)}
        dateTime={dateObj.toISOString()}
      >
        {formatRelativeTime(dateObj)}
      </time>
    </Tooltip>
  )
}
