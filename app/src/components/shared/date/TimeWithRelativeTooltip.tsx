import { twJoin } from 'tailwind-merge'
import { Tooltip } from '@/components/shared/Tooltip/Tooltip'
import { formatDateTime } from './formatDate'
import { formatRelativeTime } from './relativeTime'

type Props = {
  date: Date | string | number
  className?: string
}

export const TimeWithRelativeTooltip = ({ date, className }: Props) => {
  const dateObj = new Date(date)

  return (
    <Tooltip text={formatRelativeTime(dateObj)} className={twJoin('shrink-0', className)}>
      <time className="text-gray-500" dateTime={dateObj.toISOString()}>
        {formatDateTime(dateObj)}
      </time>
    </Tooltip>
  )
}
