import { CheckBadgeIcon } from '@heroicons/react/20/solid'
import { CheckBadgeIcon as CheckBadgeIconOutline } from '@heroicons/react/24/outline'

type Props = {
  isActive: boolean
  className: string
}

export const QaIcon = ({ isActive, className }: Props) => {
  const iconClassName = `${className} flex-none`
  return isActive ? (
    <CheckBadgeIcon className={iconClassName} aria-hidden="true" />
  ) : (
    <CheckBadgeIconOutline className={iconClassName} aria-hidden="true" />
  )
}
